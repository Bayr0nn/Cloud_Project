from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import sqlite3
import hashlib
import os
import pickle
import numpy as np
import operator

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['IMAGE_FOLDER'] = 'static/images'

# Dictionnaire pour mapper les noms de modèles aux chemins de fichiers correspondants
model_files = {
    "VGG16": "Projet/Features_train/VGG16.txt",
    "DenseNet121": "Projet/Features_train/DenseNet121.txt",
    "EfficientNetB0": "Projet/Features_train/EfficientNetB0.txt"
}

# Charger les caractéristiques pré-calculées en fonction du modèle sélectionné
def load_features(model_name):
    if model_name not in model_files:
        raise ValueError("Nom de modèle invalide")
    with open(model_files[model_name], "rb") as f:
        return pickle.load(f)

# Fonctions de calcul de distance
def euclideanDistance(l1, l2):
    n = min(len(l1), len(l2))
    return np.sqrt(np.sum((l1[:n] - l2[:n])**2))

def chiSquareDistance(l1, l2):
    n = min(len(l1), len(l2))
    l1, l2 = np.array(l1[:n]), np.array(l2[:n])
    # Pour éviter la division par zéro, ajouter un petit epsilon au dénominateur
    epsilon = 1e-10
    chi_square_dist = np.sum(((l1 - l2) ** 2) / (l1 + epsilon))
    return chi_square_dist

def bhatta(l1, l2):
    n = min(len(l1), len(l2))
    l1 = np.array(l1[:n], dtype=np.float64)
    l2 = np.array(l2[:n], dtype=np.float64)
    # Normaliser les histogrammes
    l1 = l1 / np.sum(l1)
    l2 = l2 / np.sum(l2)
    # Calculer le coefficient de Bhattacharyya
    bc = np.sum(np.sqrt(l1 * l2))
    # Calculer la distance de Bhattacharyya
    bd = -np.log(bc)
    return bd

# Obtenir les k voisins les plus proches
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

# Fonction de recherche des images similaires
def recherche(features1, image_req, top, distance_metric):
    voisins = getkVoisins(features1, features1[image_req], top, distance_metric)
    nom_images_proches = [voisins[k][0] for k in range(top)]
    # Enlever le préfixe incorrect s'il existe
    nom_images_proches = [os.path.basename(image) for image in nom_images_proches]
    return nom_images_proches

# Connexion à la base de données
def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

# Route pour la page d'accueil
@app.route('/')
def home():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

# Route pour la page de connexion
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
            error = 'Nom d\'utilisateur ou mot de passe invalide!'
            return render_template('login.html', error=error)

    return render_template('login.html')

# Route pour la déconnexion
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

# Route pour la page d'inscription
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

# Route pour la recherche d'images similaires
@app.route('/search', methods=['POST'])
def search():
    image_index = int(request.form['image_index'])
    top = int(request.form['numNeighbors'])
    model_name = request.form['model']
    distance_metric = request.form['distance']
    try:
        features1 = load_features(model_name)
        similar_images = recherche(features1, image_index, top, distance_metric)
        print(f"Similar images: {similar_images}")  # Vérifier les noms d'images
        return jsonify(similar_images=similar_images)
    except ValueError as e:
        return jsonify(error=str(e))

if __name__ == '__main__':
    app.run(debug=True)
