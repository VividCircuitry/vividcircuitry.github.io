let bluetoothDevice = null;

document.getElementById("blueConnect").addEventListener("click", () => blueConnect());

checkAndSend();
getMatchRecommendations();

setInterval(alertBluetooth, 1000);
let blinkAlert = 1;

document.getElementById("clearMatchDetailsCache").addEventListener("click", () => checkMatches());
document.getElementById("getMatchesData").addEventListener("click", () => getMatches());

function alertBluetooth() {
    let alertButton = document.getElementById("alertBluetooth");
    if (bluetoothDevice) {
        alertButton.innerText = "You are connected to the Bluetooth network.";
        alertButton.style.background = "#EE5622";
    } else {
        alertButton.style.background = blinkAlert == 1 ? "#FF0000" : "#0000FF";
        blinkAlert = blinkAlert * -1;
        alertButton.innerText = "Please connect to the Bluetooth network!";
    }
}

function blueConnect() {
    navigator.bluetooth
        .requestDevice({
            filters: [{ services: [0x180d] }],
        })
        .then((device) => {
            bluetoothDevice = device;
            device.addEventListener("gattserverdisconnected", onDisconnected);
            return forceConnect();
        })
        .catch((error) => {
            console.error("Error requesting Bluetooth device: ", error);
        });
}

function onDisconnected(event) {
    bluetoothDevice = null;
}

async function checkAndSend() {
    while (true) {
        await new Promise((r) => setTimeout(r, 10000));

        console.log("looping");
        console.log(localStorage["jsonData"]);
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            const statusValue = await getStatus();
            if (statusValue == parseInt(document.getElementById("scouterNum").value)) {
                await cutAndSendData(localStorage["jsonData"] || "");
            }
        } else {
            console.error("Device is not connected.");
        }
    }
}

async function cutAndSendData(stringData) {
    console.log('sending "' + stringData + '"');

    const fullEncodedStr = encodeString(stringData);
    const chunkSize = 500;

    for (let i = 0; i < fullEncodedStr.length; i += chunkSize) {
        const chunk = fullEncodedStr.subarray(i, i + chunkSize);
        console.log(`Sending chunk of length: ${chunk.length}`);
        await sendData(chunk);
    }
}

async function sendData(data) {
    if (bluetoothDevice.gatt.connected) {
        try {
            const service = await bluetoothDevice.gatt.getPrimaryService(0x180d);
            const characteristic = await service.getCharacteristic(0x2a39);
            console.log(data);
            await characteristic.writeValue(data);
        } catch (error) {
            console.error("Error writing data; trying again:", error);
            await new Promise((r) => setTimeout(r, 2000));
            await sendData(data);
        }
    } else {
        console.error("Device is not connected.");
    }
}

function forceConnect() {
    bluetoothDevice.gatt.connect().catch((error) => {
        console.error("DOMException occurred: ", error);
        if (error instanceof DOMException) {
            forceConnect();
        } else {
            console.error(error);
        }
    });
}

async function getStatus() {
    let statusValue = 0;

    try {
        if (bluetoothDevice.gatt.connected) {
            const service = await bluetoothDevice.gatt.getPrimaryService(0x180d);
            const characteristic = await service.getCharacteristic(0x2a37);
            const value = await characteristic.readValue();

            statusValue = value.getUint8(0);
            console.log(`Status is ${statusValue}`);
        } else {
            console.error("Device is not connected.");
        }
    } catch (error) {
        bluetoothDevice = null;
        console.error("Error reading status:", error);
    }

    return statusValue;
}

function decodeString(array) {
    const decoder = new TextDecoder();
    return decoder.decode(array);
}

function encodeString(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

async function getMatches() {
    matches = "";
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        console.log("Bluetooth device is connected.");
        dataLoop = true;
        while (dataLoop) {
            const matchesStatusService = await bluetoothDevice.gatt.getPrimaryService(0x180d);
            const matchesStatusCharacteristic = await matchesStatusService.getCharacteristic(
                0x2a91
            );
            await matchesStatusCharacteristic.writeValue(encodeString("1"));
            console.log("Wrote '1' to matchesStatusCharacteristic");

            let matchesStatusValue = await matchesStatusCharacteristic.readValue();
            matchesStatus = matchesStatusValue.getUint8(0);
            console.log(`Initial matchesStatus: ${matchesStatus}`);

            while (matchesStatus == 1) {
                matchesStatusValue = await matchesStatusCharacteristic.readValue();
                matchesStatus = matchesStatusValue.getUint8(0);
                console.log(`Updated matchesStatus: ${matchesStatus}`);
            }

            if (matchesStatus == 0) {
                const matchesDataService = await bluetoothDevice.gatt.getPrimaryService(0x180d);
                const matchesDataCharacteristic = await matchesDataService.getCharacteristic(
                    0x2a92
                );
                matchesDataValue = await matchesDataCharacteristic.readValue();
                matchesData = decodeString(matchesDataValue.buffer);
                console.log(`matchesData: ${matchesData}`);
                matches = matches + matchesData;
                console.log("Match data retrieved.");
            } else {
                dataLoop = false;
            }
        }
        console.log(matches);
        localStorage["matches"] = matches;
    } else {
        console.error("Device is not connected.");
    }
}

async function getMatchRecommendations() {
    await new Promise((r) => setTimeout(r, 2000));
    console.log(localStorage["matches"]);

    jsonParsed = JSON.parse(localStorage["matches"]);
    console.log(jsonParsed);

    for (let matchNumber = 0; matchNumber < jsonParsed[0].matches.length; matchNumber++) {
        datalist = document.getElementById("matchNumbersData");
        console.log(matchNumber.toString());

        newOption = document.createElement("option");
        newOption.value = matchNumber.toString();

        datalist.appendChild(newOption);
        console.log(matchNumber);
    }
}
