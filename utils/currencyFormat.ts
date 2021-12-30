import { convertToPounds } from "./convertToPounds";

export const currencyFormat = (amount: number, symbol = "£") =>
  `£${convertToPounds(amount)
    .toFixed(2)
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")}`;
