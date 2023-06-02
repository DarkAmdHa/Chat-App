const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const messageWithImageLink = document.querySelector(
  "#message-img-template"
).innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;
  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    address: message.address ? message.address : null,
    customClass: message.customClass ? message.customClass : null,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});

socket.on("base64 file", (data) => {
  console.log(data);
  const linkSource = data.file;
  const downloadLink = document.createElement("a");
  const fileName = data.fileName;
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.download = true;
  const html = Mustache.render(messageWithImageLink, {
    username: data.username,
    createdAt: moment(data.createdAt).format("h:mm a"),
    imageLink: linkSource,
    imageName: fileName,
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    e.target.elements.uploadFileField.value = "";
    $messageFormInput.focus();

    if (error) {
      alert(error);
      return console.log(error);
    } else {
      console.log("Message delivered!");
    }
  });
  if (e.target.elements.uploadFileField.value) {
    var data = e.target.elements.uploadFileField.files[0];
    readThenSendFile(data);
  }
});

$sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  } else {
    $sendLocationBtn.setAttribute("disabled", "disabled");

    const foundLocation = (position) => {
      console.log(position);
      debugger;
      socket.emit(
        "sendLocation", ()=>
        {
          const locationObject = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          return locationObject;
        },
        (error) => {
          $sendLocationBtn.removeAttribute("disabled");
          if (!error) {
            console.log("Location shared!");
          }
        }
      );
    }

    function noLocation(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(foundLocation, noLocation);
  }
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

function readThenSendFile(data) {
  var reader = new FileReader();
  reader.onload = function (evt) {
    var msg = {};
    msg.username = username;
    msg.file = evt.target.result;
    msg.fileName = data.name;
    socket.emit("base64 file", msg);
  };
  reader.readAsDataURL(data);
}
