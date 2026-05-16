from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes.pos_routes import pos_bp
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.partner_routes import partner_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(pos_bp, url_prefix='/api/pos')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(partner_bp, url_prefix='/api/partners')
    
    with app.app_context():
        # db.create_all() # Commented out to avoid overriding phpMyAdmin schema manually if they use the SQL file
        # Namun karena models.py sudah benar, create_all aman jika tabel tidak ada.
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
