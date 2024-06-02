from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import sqlite3
import hashlib
import os
import pickle
import numpy as np
import operator
import math

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['IMAGE_FOLDER'] = 'static/images'

# Dictionary to map model names to file paths
model_files = {
    "VGG16": "Projet/Features_train/VGG16.txt",
    "DenseNet121": "Projet/Features_train/DenseNet121.txt",
    "EfficientNetB0": "Projet/Features_train/EfficientNetB0.txt"
}

# Load the precomputed features based on the selected model
def load_features(model_name):
    if model_name not in model_files:
        raise ValueError("Invalid model name")
    with open(model_files[model_name], "rb") as f:
        return pickle.load(f)

# Distance calculation functions
def euclideanDistance(l1, l2):
    n = min(len(l1), len(l2))
    return np.sqrt(np.sum((l1[:n] - l2[:n])**2))

def chiSquareDistance(l1, l2):
    n = min(len(l1), len(l2))
    l1, l2 = np.array(l1[:n]), np.array(l2[:n])
    # To prevent division by zero, add a small epsilon to the denominator
    epsilon = 1e-10
    chi_square_dist = np.sum(((l1 - l2) ** 2) / (l1 + epsilon))
    return chi_square_dist

def bhatta(l1, l2):
    n = min(len(l1), len(l2))
    l1 = np.array(l1[:n], dtype=np.float64)
    l2 = np.array(l2[:n], dtype=np.float64)
    # Normalize the histograms
    l1 = l1 / np.sum(l1)
    l2 = l2 / np.sum(l2)
    # Calculate the Bhattacharyya coefficient
    bc = np.sum(np.sqrt(l1 * l2))
    # Calculate the Bhattacharyya distance
    bd = -np.log(bc)
    return bd

def getkVoisins(lfeatures, test, k, distance_metric):
    ldistances = []
    distance_func = globals()[distance_metric]
    for i in range(len(lfeatures)):
        dist = distance_func(test[1], lfeatures[i][1])
        ldistances.append((lfeatures[i][0], lfeatures[i][1], dist))
    ldistances.sort(key=operator.itemgetter(2))
    lvoisins = []
    for i in range(k):
        lvoisins.append(ldistances[i])
    return lvoisins

def recherche(features1, image_req, top, distance_metric):
    voisins = getkVoisins(features1, features1[image_req], top, distance_metric)
    nom_images_proches = [voisins[k][0] for k in range(top)]
    return nom_images_proches

# Database connection
def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def home():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, hashed_password))
        user = cursor.fetchone()
        conn.close()

        if user:
            session['username'] = user['username']
            return redirect(url_for('home'))
        else:
            error = 'Invalid username or password!'
            return render_template('login.html', error=error)

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        conn.commit()
        conn.close()

        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/search', methods=['POST'])
def search():
    image_index = int(request.form['image_index'])
    top = int(request.form['numNeighbors'])
    model_name = request.form['model']
    distance_metric = request.form['distance']
    try:
        features1 = load_features(model_name)
        similar_images = recherche(features1, image_index, top, distance_metric)
        return jsonify(similar_images=similar_images)
    except ValueError as e:
        return jsonify(error=str(e))

if __name__ == '__main__':
    app.run(debug=True)
