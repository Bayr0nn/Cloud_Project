document.getElementById('image_index').addEventListener('input', function() {
    const imageIndex = this.value;
    const chosenImage = document.getElementById('chosenImage');
    const imagePreview = document.getElementById('imagePreview');
    if (imageIndex) {
        const imageUrl = `static/images/${imageIndex}.jpg`; // Assurez-vous que les images sont dans ce chemin
        chosenImage.src = imageUrl;
        chosenImage.onload = function() {
            chosenImage.style.maxWidth = '100%';
            chosenImage.style.maxHeight = '300px'; // Limite de la hauteur de l'image
        };
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
});

document.getElementById('searchButton').addEventListener('click', function() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Get user input
    const imageIndex = document.getElementById('image_index').value;
    const numNeighbors = document.getElementById('numNeighbors').value;
    const model = document.getElementById('model').value;
    const distanceMetric = document.getElementById('distance').value;
    
    // Call backend API to perform the search
    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_index: imageIndex,
            numNeighbors: numNeighbors,
            model: model,
            distance_metric: distanceMetric
        })
    }).then(response => response.json())
    .then(data => {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('results').style.display = 'block';
        
        // Display results
        document.getElementById('graph').innerHTML = data.graph;
        document.getElementById('topResults').innerHTML = data.topResults.map(result => `
            <div>
                <img src="${result.imageUrl}" alt="${result.similarity}">
                <p>Similarity: ${result.similarity}</p>
            </div>
        `).join('');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const imageIndexInput = document.getElementById('image_index');
    const numNeighborsInput = document.getElementById('numNeighbors');
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.style.display = 'none';
    document.querySelector('main').appendChild(errorMessage);

    const loadingSpinner = document.getElementById('loadingSpinner');

    searchButton.addEventListener('click', function(event) {
        const imageIndex = imageIndexInput.value;
        const numNeighbors = numNeighborsInput.value;
        let error = '';

        if (!imageIndex) {
            error += 'Veuillez entrer le numéro de l\'image.<br>';
        }

        if (!numNeighbors) {
            error += 'Veuillez entrer le nombre de voisins.<br>';
        }

        if (error) {
            event.preventDefault();
            errorMessage.innerHTML = error;
            errorMessage.style.display = 'block';
            loadingSpinner.style.display = 'none'; // Hide spinner if there's an error
        } else {
            errorMessage.style.display = 'none';
            loadingSpinner.style.display = 'block'; // Show spinner when the search is launched
            // Add code here to launch the search
        }
    });
});
