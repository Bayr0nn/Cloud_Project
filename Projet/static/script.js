// Ajout d'un écouteur d'événements pour l'entrée du numéro de l'image
document.getElementById('image_index').addEventListener('input', function() {
    const imageIndex = this.value;
    const chosenImage = document.getElementById('chosenImage');
    const imagePreview = document.getElementById('imagePreview');
    const imageIndexError = document.getElementById('imageIndexError');

    // Vérifier si le numéro de l'image est dans la plage valide
    if (imageIndex < 0 || imageIndex > 999) {
        imageIndexError.style.display = 'block';
        imagePreview.style.display = 'none';
    } else {
        imageIndexError.style.display = 'none';
        if (imageIndex) {
            const imageUrl = `static/images/${imageIndex}.jpg`; // Assurez-vous que les images sont dans ce chemin
            chosenImage.src = imageUrl;
            chosenImage.onload = function() {
                chosenImage.style.maxWidth = '100%';
                chosenImage.style.maxHeight = '300px'; // Limite de la hauteur de l'image
            };
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none'; // Masquer l'aperçu de l'image si aucun numéro n'est entré
        }
    }
});

// Ajout d'un écouteur d'événements pour l'entrée du nombre de voisins
document.getElementById('numNeighbors').addEventListener('input', function() {
    const numNeighbors = this.value;
    const numNeighborsError = document.getElementById('numNeighborsError');

    // Vérifier si le nombre de voisins est dans la plage valide
    if (numNeighbors < 1 || numNeighbors > 1000) {
        numNeighborsError.style.display = 'block';
    } else {
        numNeighborsError.style.display = 'none';
    }
});

// Ajout d'un écouteur d'événements pour le bouton de recherche
document.getElementById('searchButton').addEventListener('click', function(event) {
    event.preventDefault(); // Empêcher la soumission par défaut du formulaire

    const imageIndex = document.getElementById('image_index').value;
    const numNeighbors = document.getElementById('numNeighbors').value;
    const model = document.getElementById('model').value;
    const distanceMetric = document.getElementById('distance').value;

    // Validation des entrées utilisateur
    const errorMessage = document.getElementById('error-message');
    let error = '';

    if (imageIndex === '' || imageIndex < 0 || imageIndex > 999) {
        error += 'Veuillez entrer un numéro d\'image correct.<br>';
    }

    if (numNeighbors === '' || numNeighbors < 1 || numNeighbors > 1000) {
        error += 'Veuillez entrer un nombre de voisins correct.<br>';
    }

    if (error) {
        errorMessage.innerHTML = error;
        errorMessage.style.display = 'block';
        return;
    } else {
        errorMessage.style.display = 'none';
    }

    document.getElementById('results').style.display = 'none';

    // Créer un objet FormData pour envoyer les données
    const formData = new FormData();
    formData.append('image_index', imageIndex);
    formData.append('numNeighbors', numNeighbors);
    formData.append('model', model);
    formData.append('distance', distanceMetric);
    
    // Appeler l'API backend pour effectuer la recherche
    fetch('/search', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        document.getElementById('results').style.display = 'block';
        
        // Afficher les résultats
        const resultsContainer = document.getElementById('topResults');
        resultsContainer.innerHTML = '';

        if (data.error) {
            resultsContainer.innerHTML = `<p>${data.error}</p>`; // Afficher le message d'erreur
        } else {
            data.similar_images.forEach(image => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('result-container'); // Ajouter une classe pour le style

                const imgElement = document.createElement('img');
                imgElement.src = `static/images/${image}`;
                imgElement.classList.add('result-image'); // Ajouter une classe pour le style

                const imgCaption = document.createElement('p');
                imgCaption.innerText = image; // Ajouter le nom de l'image en tant que légende

                imgContainer.appendChild(imgElement);
                imgContainer.appendChild(imgCaption);
                resultsContainer.appendChild(imgContainer);
            });

            // Mettre à jour et afficher l'image RP
            const rpImage = document.getElementById('rpImage');
            if (data.rp_image) {
                rpImage.src = `${data.rp_image}?t=${new Date().getTime()}`; // Ajouter un timestamp pour forcer le rechargement
                rpImage.style.display = 'block';
            } else {
                rpImage.style.display = 'none';
            }
        }
    }).catch(error => {
        console.error('Error:', error); // Afficher l'erreur dans la console
    });
});

// Exécuter cette fonction lorsque le document est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Ajout d'un élément pour afficher les messages d'erreur
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.color = 'yellow';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.display = 'none';
    document.querySelector('main').appendChild(errorMessage);
});
