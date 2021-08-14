import { Color } from "@skeldjs/constant";
import { Int2Code, sleep } from "@skeldjs/util";

import { PolusGGClient } from "../src";


const polusGGClient = new PolusGGClient("2021.6.30s");

(async () => {
    console.log("logging in..");
    await polusGGClient.login(process.env.PGG_EMAIL, process.env.PGG_PASSWORD);
    console.log("connecting..");
    await polusGGClient.connect("72.68.129.83", 22023);
    console.log("creating game..");
    await polusGGClient.hostGame(true);

    console.log("code: " + Int2Code(polusGGClient.skeldjsClient.code));

    await sleep(1000);

    polusGGClient.skeldjsClient.me.control.checkName("hello");
    polusGGClient.skeldjsClient.me.control.checkColor(Color.Blue);

    await sleep(500);

    polusGGClient.skeldjsClient.on("player.join", async () => {
        console.log("player joined, waiting 5s");
        await sleep(5000);

        polusGGClient.gameOptions.setOption("Impostor Count", 80, true);
    });
})();