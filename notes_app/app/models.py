from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, id, email, display_name, password, is_verified, token=None, avatar=None):
        self.id = id
        self.email = email
        self.display_name = display_name
        self.password = password
        self.is_verified = is_verified
        self.token = token  # optional
        self.avatar = avatar
