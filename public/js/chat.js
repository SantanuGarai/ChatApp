//When the new connection comes in on the client, when we initialize the connection, we now also get access to Sacket.
//And this is going to allow us to send events and receive events from both the server and the client.
const socket = io();

//elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#message");
//template
const messageTemplate = document.querySelector("#message-template").innerHTML;

socket.on("message", (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, { message });
    $messages.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    //disable form button
    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;
    socket.emit("sendMessage", message, (error) => {
        //enable form button after delivering the message
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
        console.log("Message delivered");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser");
    }
    //disable sendlocation button after sending location as it takes few second to send send location.
    $sendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendlocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                //enable the the sendlocation button after delivering loaction.
                $sendLocationButton.removeAttribute("disabled");
                console.log("location shared");
            }
        );
    });
});
