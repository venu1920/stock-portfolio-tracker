import os
import io
import csv
import random
import base64
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from models import db, User, Stock, WatchlistItem
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = Flask(__name__)
# Configure SQLite DB
db_path = os.path.join(app.instance_path, 'portfolio.db')
os.makedirs(app.instance_path, exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key-stock-tracker-2026'

# Enable CORS for all routes (including localhost:5173 for Vite React dev server)
CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

# Helper: Simple base64 token generator/decoder for Authentication
def generate_token(user):
    token_str = f"{user.id}:{user.username}"
    return base64.b64encode(token_str.encode('utf-8')).decode('utf-8')

def get_user_from_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        token = auth_header.split(' ')[1]
        decoded = base64.b64decode(token.encode('utf-8')).decode('utf-8')
        user_id_str, username = decoded.split(':', 1)
        user_id = int(user_id_str)
        user = db.session.get(User, user_id)
        if user and user.username == username:
            return user
    except Exception:
        pass
    return None

def login_required(f):
    def decorator(*args, **kwargs):
        user = get_user_from_request()
        if not user:
            return jsonify({'error': 'Unauthorized access. Please login first.'}), 401
        return f(user, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

# --- AUTH ROUTES ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400
        
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters long.'}), 400
        
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long.'}), 400
        
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists.'}), 400
        
    try:
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Registration successful!', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400
        
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password.'}), 401
        
    token = generate_token(user)
    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user': user.to_dict()
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_me(user):
    return jsonify({'user': user.to_dict()}), 200

# --- STOCKS CRUD ROUTES ---

@app.route('/api/stocks', methods=['GET'])
@login_required
def get_stocks(user):
    stocks = Stock.query.filter_by(user_id=user.id).all()
    return jsonify([stock.to_dict() for stock in stocks]), 200

@app.route('/api/stocks', methods=['POST'])
@login_required
def add_stock(user):
    data = request.get_json() or {}
    symbol = data.get('stock_symbol', '').strip().upper()
    company_name = data.get('company_name', '').strip()
    quantity = data.get('quantity')
    buy_price = data.get('buy_price')
    current_price = data.get('current_price')
    purchase_date = data.get('purchase_date')

    # Frontend validation rules mirrors
    if not symbol or len(symbol) > 10:
        return jsonify({'error': 'Stock symbol is required and must be max 10 characters.'}), 400
    if not company_name:
        return jsonify({'error': 'Company name is required.'}), 400
        
    try:
        quantity = float(quantity)
        if quantity <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'error': 'Quantity must be a positive number.'}), 400
        
    try:
        buy_price = float(buy_price)
        if buy_price <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'error': 'Buy price must be a numeric value greater than 0.'}), 400
        
    try:
        current_price = float(current_price) if current_price is not None else buy_price
        if current_price <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'error': 'Current price must be a numeric value greater than 0.'}), 400

    total_investment = round(quantity * buy_price, 2)
    if user.demo_balance < total_investment:
        return jsonify({'error': f'Insufficient practice cash! Needed: ${total_investment:,.2f}, Available: ${user.demo_balance:,.2f}'}), 400

    if not purchase_date:
        from datetime import datetime
        purchase_date = datetime.utcnow().strftime('%Y-%m-%d')

    try:
        new_stock = Stock(
            user_id=user.id,
            stock_symbol=symbol,
            company_name=company_name,
            quantity=quantity,
            buy_price=buy_price,
            current_price=current_price,
            purchase_date=purchase_date
        )
        user.demo_balance = round(user.demo_balance - total_investment, 2)
        db.session.add(new_stock)
        db.session.commit()
        return jsonify({
            'stock': new_stock.to_dict(),
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add stock: {str(e)}'}), 500

@app.route('/api/stocks/<int:stock_id>', methods=['PUT'])
@login_required
def update_stock(user, stock_id):
    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found.'}), 404
        
    data = request.get_json() or {}
    symbol = data.get('stock_symbol', '').strip().upper()
    company_name = data.get('company_name', '').strip()
    quantity = data.get('quantity')
    buy_price = data.get('buy_price')
    current_price = data.get('current_price')
    purchase_date = data.get('purchase_date')

    # Save original values for balance diff
    orig_investment = stock.total_investment

    # Temporarily apply values to do validation
    new_quantity = float(quantity) if quantity is not None else stock.quantity
    new_buy_price = float(buy_price) if buy_price is not None else stock.buy_price

    if new_quantity <= 0 or new_buy_price <= 0:
        return jsonify({'error': 'Quantity and buy price must be positive numbers.'}), 400

    new_investment = round(new_quantity * new_buy_price, 2)
    diff = round(new_investment - orig_investment, 2)

    if diff > 0 and user.demo_balance < diff:
        return jsonify({'error': f'Insufficient practice cash to increase position! Needed: ${diff:,.2f}, Available: ${user.demo_balance:,.2f}'}), 400

    if symbol:
        if len(symbol) > 10:
            return jsonify({'error': 'Stock symbol must be max 10 characters.'}), 400
        stock.stock_symbol = symbol
        
    if company_name:
        stock.company_name = company_name
        
    if quantity is not None:
        stock.quantity = new_quantity
            
    if buy_price is not None:
        stock.buy_price = new_buy_price
            
    if current_price is not None:
        try:
            current_price = float(current_price)
            if current_price <= 0:
                raise ValueError()
            stock.current_price = current_price
        except (TypeError, ValueError):
            return jsonify({'error': 'Current price must be greater than 0.'}), 400

    if purchase_date:
        stock.purchase_date = purchase_date

    try:
        user.demo_balance = round(user.demo_balance - diff, 2)
        db.session.commit()
        return jsonify({
            'stock': stock.to_dict(),
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update stock: {str(e)}'}), 500

@app.route('/api/stocks/<int:stock_id>', methods=['DELETE'])
@login_required
def delete_stock(user, stock_id):
    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found.'}), 404
        
    try:
        sale_value = stock.current_value
        user.demo_balance = round(user.demo_balance + sale_value, 2)
        db.session.delete(stock)
        db.session.commit()
        return jsonify({
            'message': f'Sold {stock.stock_symbol} position for ${sale_value:,.2f}.',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete stock: {str(e)}'}), 500

@app.route('/api/auth/reset-demo', methods=['POST'])
@login_required
def reset_demo(user):
    try:
        # Delete all stocks for this user
        Stock.query.filter_by(user_id=user.id).delete()
        user.demo_balance = 100000.0
        db.session.commit()
        return jsonify({
            'message': 'Demo portfolio reset successfully to $100,000.00.',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reset demo: {str(e)}'}), 500

# --- WATCHLIST ROUTES ---

@app.route('/api/watchlist', methods=['GET'])
@login_required
def get_watchlist(user):
    items = WatchlistItem.query.filter_by(user_id=user.id).all()
    return jsonify([item.to_dict() for item in items]), 200

@app.route('/api/watchlist', methods=['POST'])
@login_required
def add_watchlist_item(user):
    data = request.get_json() or {}
    symbol = data.get('stock_symbol', '').strip().upper()
    company_name = data.get('company_name', '').strip()
    added_price = data.get('added_price')
    
    if not symbol:
        return jsonify({'error': 'Stock symbol is required.'}), 400
    if not company_name:
        return jsonify({'error': 'Company name is required.'}), 400
        
    if added_price is not None:
        try:
            added_price = float(added_price)
        except ValueError:
            added_price = None

    # Check if already exists in user's watchlist
    exists = WatchlistItem.query.filter_by(user_id=user.id, stock_symbol=symbol).first()
    if exists:
        return jsonify({'error': f'{symbol} is already in your watchlist.'}), 400

    try:
        new_item = WatchlistItem(
            user_id=user.id,
            stock_symbol=symbol,
            company_name=company_name,
            added_price=added_price
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add to watchlist: {str(e)}'}), 500

@app.route('/api/watchlist/<int:item_id>', methods=['DELETE'])
@login_required
def delete_watchlist_item(user, item_id):
    item = WatchlistItem.query.filter_by(id=item_id, user_id=user.id).first()
    if not item:
        return jsonify({'error': 'Watchlist item not found.'}), 404
        
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': f'Watchlist item {item.stock_symbol} deleted.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete watchlist item: {str(e)}'}), 500

# --- DATA EXPORT ROUTES ---

@app.route('/api/stocks/export/csv', methods=['GET'])
@login_required
def export_csv(user):
    stocks = Stock.query.filter_by(user_id=user.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'Stock Symbol', 'Company Name', 'Quantity', 'Buy Price ($)', 
        'Current Price ($)', 'Total Investment ($)', 'Current Value ($)', 
        'Profit / Loss ($)', 'P/L (%)', 'Purchase Date'
    ])
    
    for stock in stocks:
        writer.writerow([
            stock.stock_symbol,
            stock.company_name,
            stock.quantity,
            stock.buy_price,
            stock.current_price,
            stock.total_investment,
            stock.current_value,
            stock.profit_loss,
            stock.profit_loss_percentage,
            stock.purchase_date
        ])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'portfolio_export_{user.username}.csv'
    )

@app.route('/api/stocks/export/pdf', methods=['GET'])
@login_required
def export_pdf(user):
    stocks = Stock.query.filter_by(user_id=user.id).all()
    
    # Calculate overall summary metrics
    total_inv = sum(s.total_investment for s in stocks)
    total_val = sum(s.current_value for s in stocks)
    total_pl = total_val - total_inv
    pl_pct = (total_pl / total_inv * 100) if total_inv > 0 else 0
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Premium Feel
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#4F46E5'),  # Indigo
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6B7280'),  # Cool Gray
        spaceAfter=25
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#111827'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#374151')
    )

    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    story = []
    
    # Title
    story.append(Paragraph("Stock Portfolio Report", title_style))
    story.append(Paragraph(f"Generated for: {user.username} | Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Summary Table
    story.append(Paragraph("Portfolio Overview", section_title))
    summary_data = [
        [
            Paragraph("<b>Total Investment</b>", body_style),
            Paragraph("<b>Current Value</b>", body_style),
            Paragraph("<b>Total Profit / Loss</b>", body_style),
            Paragraph("<b>Growth Percentage</b>", body_style)
        ],
        [
            f"${total_inv:,.2f}",
            f"${total_val:,.2f}",
            f"${total_pl:,.2f}",
            f"{pl_pct:+.2f}%"
        ]
    ]
    
    summary_table = Table(summary_data, colWidths=[130, 130, 140, 140])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('TEXTCOLOR', (2, 1), (2, 1), colors.HexColor('#10B981') if total_pl >= 0 else colors.HexColor('#EF4444')),
        ('TEXTCOLOR', (3, 1), (3, 1), colors.HexColor('#10B981') if pl_pct >= 0 else colors.HexColor('#EF4444')),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 11),
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Stocks Table
    story.append(Paragraph("Holdings Breakdown", section_title))
    
    table_data = [[
        Paragraph("Symbol", header_style),
        Paragraph("Company Name", header_style),
        Paragraph("Qty", header_style),
        Paragraph("Buy Price", header_style),
        Paragraph("Current Price", header_style),
        Paragraph("Total Inv.", header_style),
        Paragraph("Current Value", header_style),
        Paragraph("Net P/L", header_style)
    ]]
    
    for idx, s in enumerate(stocks):
        pl_color = '#10B981' if s.profit_loss >= 0 else '#EF4444'
        table_data.append([
            Paragraph(f"<b>{s.stock_symbol}</b>", body_style),
            Paragraph(s.company_name, body_style),
            f"{s.quantity:,.2f}",
            f"${s.buy_price:,.2f}",
            f"${s.current_price:,.2f}",
            f"${s.total_investment:,.2f}",
            f"${s.current_value:,.2f}",
            Paragraph(f"<font color='{pl_color}'><b>${s.profit_loss:+,.2f} ({s.profit_loss_percentage:+.2f}%)</b></font>", body_style)
        ])
        
    stocks_table = Table(table_data, colWidths=[55, 110, 45, 65, 75, 75, 75, 100])
    stocks_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    
    story.append(stocks_table)
    
    doc.build(story)
    
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'portfolio_report_{user.username}.pdf'
    )

# --- PRICE TICK SIMULATION ROUTE ---

@app.route('/api/stocks/simulate-tick', methods=['POST'])
@login_required
def simulate_tick(user):
    stocks = Stock.query.filter_by(user_id=user.id).all()
    updated_stocks = []
    
    try:
        for stock in stocks:
            # Fluctuate stock current price by -1.5% to +1.5%
            pct_change = random.uniform(-0.015, 0.015)
            new_price = max(0.01, round(stock.current_price * (1 + pct_change), 2))
            stock.current_price = new_price
            updated_stocks.append(stock.to_dict())
            
        db.session.commit()
        return jsonify({
            'message': 'Simulated price updates successfully.',
            'stocks': updated_stocks
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Price simulation tick failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
from datetime import datetime
