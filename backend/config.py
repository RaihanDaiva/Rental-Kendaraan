import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    
    # SQLAlchemy Configuration
    db_user = os.environ.get('DB_USER', 'root')
    db_password = os.environ.get('DB_PASSWORD', '')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_name = os.environ.get('DB_NAME', 'pos_rental')
    
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Midtrans Configuration
    MIDTRANS_SERVER_KEY = os.environ.get('MIDTRANS_SERVER_KEY')
    MIDTRANS_CLIENT_KEY = os.environ.get('MIDTRANS_CLIENT_KEY')
    MIDTRANS_IS_PRODUCTION = os.environ.get('MIDTRANS_IS_PRODUCTION', 'False').lower() == 'true'
