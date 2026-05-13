import "./style.css";
import { initWaves } from "./waves.ts";

if (document.getElementById("canvas")) {
  initWaves("canvas");
}
