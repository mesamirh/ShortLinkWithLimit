document.getElementById('shorten-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const originalUrl = document.getElementById('originalUrl').value;
    const visitLimit = document.getElementById('visitLimit').value;

    const response = await fetch('/shorten', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ originalUrl, visitLimit })
    });

    const result = await response.json();
    document.getElementById('result').innerText = `Short URL: ${window.location.origin}/${result.shortUrl}`;
});