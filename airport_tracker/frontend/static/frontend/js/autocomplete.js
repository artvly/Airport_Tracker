document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('suggestions-container');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
  
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
    }

    if (query.length < 2) {
        suggestionsContainer.innerHTML = '';
        return;
    }
        
        // Запрос к API
    fetch(`/api/airport-autocomplete/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            showSuggestions(data.results);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
    
    function showSuggestions(results) {
        suggestionsContainer.innerHTML = '';
        
        if (results.length === 0) {
            return;
        }
        
        results.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.text;
            div.style.cursor = 'pointer';
            div.style.padding = '5px';
            div.style.border = '1px solid #3498db';
            div.style.background='#ddd';
            div.addEventListener('click', function() {
                searchInput.value = item.name;
                suggestionsContainer.innerHTML = '';
            });
            
            suggestionsContainer.appendChild(div);
        });
    }
});