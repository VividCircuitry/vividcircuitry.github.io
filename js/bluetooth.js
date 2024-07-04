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
    console.log(
        findDiff(
            localStorage["matches"],
            '[{"matches":[{"matchNum":0,"redAlliance":["frc9998","frc369","frc694"],"blueAlliance":["frc1923","frc2265","frc2539"]},{"matchNum":1,"redAlliance":["frc9998","frc369","frc694"],"blueAlliance":["frc1923","frc2265","frc2539"]},{"matchNum":2,"redAlliance":["frc2265","frc7045","frc2607"],"blueAlliance":["frc1640","frc7414","frc316"]},{"matchNum":3,"redAlliance":["frc41","frc4342","frc7414"],"blueAlliance":["frc5457","frc555","frc7045"]},{"matchNum":4,"redAlliance":["frc9998","frc433","frc4575"],"blueAlliance":["frc694","frc316","frc1155"]},{"matchNum":5,"redAlliance":["frc9999","frc2265","frc9015"],"blueAlliance":["frc1923","frc1218","frc341"]},{"matchNum":6,"redAlliance":["frc369","frc5401","frc365"],"blueAlliance":["frc2607","frc2539","frc484"]},{"matchNum":7,"redAlliance":["frc694","frc5457","frc1640"],"blueAlliance":["frc7414","frc1155","frc9998"]},{"matchNum":8,"redAlliance":["frc8714","frc341","frc316"],"blueAlliance":["frc41","frc1923","frc555"]},{"matchNum":9,"redAlliance":["frc5401","frc9015","frc1218"],"blueAlliance":["frc365","frc433","frc7045"]},{"matchNum":10,"redAlliance":["frc484","frc9999","frc369"],"blueAlliance":["frc4342","frc4575","frc2265"]},{"matchNum":11,"redAlliance":["frc1155","frc8714","frc2539"],"blueAlliance":["frc341","frc2607","frc9998"]},{"matchNum":12,"redAlliance":["frc316","frc41","frc5457"],"blueAlliance":["frc1218","frc7414","frc365"]},{"matchNum":13,"redAlliance":["frc5457","frc365","frc1155"],"blueAlliance":["frc9999","frc4342","frc8714"]},{"matchNum":14,"redAlliance":["frc2265","frc694","frc1923"],"blueAlliance":["frc7045","frc5401","frc4342"]},{"matchNum":15,"redAlliance":["frc433","frc9999","frc555"],"blueAlliance":["frc2539","frc369","frc1640"]},{"matchNum":16,"redAlliance":["frc4575","frc2607","frc5457"],"blueAlliance":["frc9015","frc484","frc41"]},{"matchNum":17,"redAlliance":["frc555","frc2539","frc1218"],"blueAlliance":["frc484","frc694","frc4575"]},{"matchNum":18,"redAlliance":["frc9998","frc41","frc5401"],"blueAlliance":["frc9015","frc369","frc1923"]},{"matchNum":19,"redAlliance":["frc433","frc1640","frc2607"],"blueAlliance":["frc341","frc5457","frc4342"]},{"matchNum":20,"redAlliance":["frc7045","frc8714","frc7414"],"blueAlliance":["frc2539","frc4575","frc9999"]},{"matchNum":21,"redAlliance":["frc555","frc9998","frc694"],"blueAlliance":["frc365","frc2265","frc41"]},{"matchNum":22,"redAlliance":["frc1923","frc316","frc484"],"blueAlliance":["frc1155","frc9015","frc433"]},{"matchNum":23,"redAlliance":["frc1640","frc341","frc5401"],"blueAlliance":["frc8714","frc1218","frc369"]},{"matchNum":24,"redAlliance":["frc2607","frc9999","frc341"],"blueAlliance":["frc1923","frc2265","frc2539"]},{"matchNum":25,"redAlliance":["frc9998","frc369","frc694"],"blueAlliance":["frc4342","frc7414","frc316"]},{"matchNum":26,"redAlliance":["frc2539","frc2265","frc1923"],"blueAlliance":["frc1218","frc8714","frc1155"]},{"matchNum":27,"redAlliance":["frc4342","frc7414","frc316"],"blueAlliance":["frc1923","frc2265","frc2539"]},{"matchNum":28,"redAlliance":["frc1923","frc2265","frc2539"],"blueAlliance":["frc694","frc369","frc9998"]},{"matchNum":29,"redAlliance":["frc1640","frc5457","frc365"],"blueAlliance":["frc1218","frc8714","frc1155"]},{"matchNum":30,"redAlliance":["frc484","frc41","frc555"],"blueAlliance":["frc316","frc7414","frc4342"]},{"matchNum":31,"redAlliance":["frc2607","frc9999","frc341"],"blueAlliance":["frc9015","frc5401","frc4575"]},{"matchNum":32,"redAlliance":["frc1923","frc2265","frc2539"],"blueAlliance":["frc365","frc5457","frc1640"]},{"matchNum":33,"redAlliance":["frc484","frc41","frc555"],"blueAlliance":["frc9015","frc5401","frc4575"]},{"matchNum":34,"redAlliance":["frc9998","frc369","frc694"],"blueAlliance":["frc1218","frc8714","frc1155"]},{"matchNum":35,"redAlliance":["frc4342","frc7414","frc316"],"blueAlliance":["frc341","frc9999","frc2607"]},{"matchNum":36,"redAlliance":["frc1155","frc8714","frc1218"],"blueAlliance":["frc9015","frc5401","frc4575"]}]}]'
        )
    );

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

function findDiff(str1, str2) {
    let diff = "";
    str2.split("").forEach(function (val, i) {
        if (val != str1.charAt(i)) diff += val;
    });
    return diff;
}
