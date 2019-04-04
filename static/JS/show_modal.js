// Get the button that opens the modal
var btn = document.getElementById("share-route-Btn");

btn.onclick = function () {
    if (confirm('Are you sure you want to share your route with other people for carpooling?')) {
        // Save it!
    } else {
        // Do nothing!
    }
};
