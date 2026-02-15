from flask import Flask
import os


def create_app():
    app = Flask(__name__, template_folder="../templates", static_folder="../static")

    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)

    from app.routes import bp

    app.register_blueprint(bp)

    return app
