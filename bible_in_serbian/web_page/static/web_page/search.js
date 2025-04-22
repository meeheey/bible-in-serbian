function filterVerses(targetDivId, searchText) {
    const verses = document.querySelectorAll(`#${targetDivId} .verse`);
    const searchTerms = searchText.toLowerCase().split(/\s+/);

    function matchesSearch(verseText, terms) {
        return terms.every(term => {
            if (term.startsWith('!')) {
                return !verseText.includes(term.slice(1));
            }
            if (term.includes('&')) {
                return term.split('&').every(t => verseText.includes(t));
            }
            if (term.includes('|')) {
                return term.split('|').some(t => verseText.includes(t));
            }
            return verseText.includes(term);
        });
    }

    verses.forEach(verse => {
        const verseText = verse.textContent.toLowerCase();
        const shouldShow = searchText === '' || matchesSearch(verseText, searchTerms);
        verse.style.display = shouldShow ? 'block' : 'none';
    });
}

// Event listener for search bar
const searchBar = document.getElementById('searchBar');
if (searchBar) {
    searchBar.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        filterVerses('verses', searchText);
    });
} else {
    console.error('Element with id "searchBar" not found.');
}