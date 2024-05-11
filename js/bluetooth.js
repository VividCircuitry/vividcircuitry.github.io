// function blueConnect(){
//     navigator.bluetooth.requestDevice({
//         acceptAllDevices: true,
//       })
//       .then(device => { /* … */ })
//       .catch(error => { console.error(error); });
// }

// function bluePush(){
    
// }


// document.addEventListener("blueConnect", () => blueConnect())
// document.addEventListener("bluePush", () => bluePush())

button.addEventListener('pointermove', function(event) {
    navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // Required to access service later.
      })
      .then(device => { /* … */ })
      .catch(error => { console.error(error); });
      
});  