import { Color } from "@skeldjs/constant";
import { Int2Code, sleep } from "@skeldjs/util";

import { PolusGGClient } from "../src";


const polusGGClient = new PolusGGClient("2021.6.30s");

(async () => {
    console.log("logging in..");
    await polusGGClient.login(process.env.PGG_EMAIL, process.env.PGG_PASSWORD);
    console.log("connecting..");
    await polusGGClient.connect("72.68.129.83", 22023);
    console.log("joining game..");
    await polusGGClient.skeldjsClient.joinGame("MGPCUK");

    polusGGClient.skeldjsClient.me.control.checkName("hello");
    polusGGClient.skeldjsClient.me.control.checkColor(Color.Blue);
})();