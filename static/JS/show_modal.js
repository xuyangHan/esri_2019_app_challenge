// Get the button that opens the modal
var btn = document.getElementById("share-route-Btn");

btn.onclick = function () {
    if (confirm('Are you sure you want to share your route with other people for carpooling?')) {
        // Save it!
    } else {
        // Do nothing!
    }
};

function tab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab-links");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" is-active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " is-active";
}