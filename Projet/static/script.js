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

document.getElementById('searchButton').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission

    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Get user input
    const imageIndex = document.getElementById('image_index').value;
    const numNeighbors = document.getElementById('numNeighbors').value;
    const model = document.getElementById('model').value;
    const distanceMetric = document.getElementById('distance').value;

    // Create FormData object to send data
    const formData = new FormData();
    formData.append('image_index', imageIndex);
    formData.append('numNeighbors', numNeighbors);
    formData.append('model', model);
    formData.append('distance', distanceMetric);
    
    // Call backend API to perform the search
    fetch('/search', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
    .then(data => {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('results').style.display = 'block';
        
        // Display results
        const resultsContainer = document.getElementById('topResults');
        resultsContainer.innerHTML = '';

        if (data.error) {
            resultsContainer.innerHTML = `<p>${data.error}</p>`;
        } else {
            data.similar_images.forEach(image => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('result-container'); // Add class for additional styling

                const imgElement = document.createElement('img');
                imgElement.src = `static/images/${image}`;
                imgElement.classList.add('result-image'); // Add class for additional styling

                const imgCaption = document.createElement('p');
                imgCaption.innerText = image; // Add image name as caption

                imgContainer.appendChild(imgElement);
                imgContainer.appendChild(imgCaption);
                resultsContainer.appendChild(imgContainer);
            });
        }
    }).catch(error => {
        document.getElementById('loadingSpinner').style.display = 'none';
        console.error('Error:', error);
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
