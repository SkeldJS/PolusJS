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
    
    polusGGClient.skeldjsClient.me.control.checkColor(Color.Blue);
    polusGGClient.skeldjsClient.me.control.checkName("hello");

    await sleep(2000);

    polusGGClient.setPet("glitch pet");
    polusGGClient.setSkin("prisoner skin");
    try {
        polusGGClient.setHat("tennis");
    } catch (e) {

    }
})();