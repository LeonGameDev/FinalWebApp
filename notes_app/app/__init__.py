import os
from flask import Flask
from flask_mysqldb import MySQL
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail

app = Flask(__name__)
app.config.from_pyfile('../config.py')

mysql = MySQL(app)
bcrypt = Bcrypt(app)
mail = Mail(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

from app import routes

from app.models import User

@login_manager.user_loader
def load_user(user_id):
    from app import mysql
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, email, display_name, password, is_verified, verification_token, avatar FROM users WHERE id = %s", (user_id,))
    result = cur.fetchone()
    if result:
        return User(*result)
    return None

from app import notes  
from flask_avatars import Avatars
avatars = Avatars(app)
app.config['AVATARS_SAVE_PATH'] = os.path.join(app.static_folder, 'avatars')
os.makedirs(app.config['AVATARS_SAVE_PATH'], exist_ok=True)  # Create folder if missing