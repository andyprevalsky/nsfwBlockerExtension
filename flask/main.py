import random 
import flask
from flask_cors import CORS
import base64

from flask import (
    Flask, request, jsonify
)

app = Flask(__name__)
CORS(app)


def isNSFW(blob):
    return True


@app.route('/classify', methods=['POST', 'GET'])
def classify():
    res = []
    for i in request.files:
        res.append(isNSFW(request.files[i]))
    return jsonify(res)

@app.route('/')
def hello():
    """Return a friendly HTTP greeting."""
    return 'no home page'


if __name__ == '__main__':
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)

