from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    demo_balance = db.Column(db.Float, nullable=False, default=100000.0)
    real_balance = db.Column(db.Float, nullable=False, default=0.0)
    
    # Relationships
    stocks = db.relationship('Stock', backref='user', lazy=True, cascade="all, delete-orphan")
    watchlist = db.relationship('WatchlistItem', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'demo_balance': round(self.demo_balance, 2),
            'real_balance': round(self.real_balance, 2)
        }

class Stock(db.Model):
    __tablename__ = 'stocks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)
    current_price = db.Column(db.Float, nullable=False)
    purchase_date = db.Column(db.String(50), nullable=False, default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    is_real = db.Column(db.Boolean, nullable=False, default=False)

    @property
    def total_investment(self):
        return round(self.quantity * self.buy_price, 2)

    @property
    def current_value(self):
        return round(self.quantity * self.current_price, 2)

    @property
    def profit_loss(self):
        return round(self.current_value - self.total_investment, 2)

    @property
    def profit_loss_percentage(self):
        if self.total_investment == 0:
            return 0.0
        return round((self.profit_loss / self.total_investment) * 100, 2)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stock_symbol': self.stock_symbol.upper(),
            'company_name': self.company_name,
            'quantity': self.quantity,
            'buy_price': self.buy_price,
            'current_price': self.current_price,
            'purchase_date': self.purchase_date,
            'total_investment': self.total_investment,
            'current_value': self.current_value,
            'profit_loss': self.profit_loss,
            'profit_loss_percentage': self.profit_loss_percentage,
            'is_real': self.is_real
        }

class WatchlistItem(db.Model):
    __tablename__ = 'watchlist'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    added_price = db.Column(db.Float, nullable=True)
    added_date = db.Column(db.String(50), nullable=False, default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stock_symbol': self.stock_symbol.upper(),
            'company_name': self.company_name,
            'added_price': self.added_price,
            'added_date': self.added_date
        }
