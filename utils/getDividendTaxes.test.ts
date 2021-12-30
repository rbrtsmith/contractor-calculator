import { getDividendTaxes } from "./getDividendTaxes";
import { convertToPence } from "./convertToPence";

// test("it works", () => {
//   expect(
//     getDividendTaxes({
//       dividendDrawdown: 0,
//       salaryDrawdown: 0,
//     })
//   ).toEqual({
//     basic: 0,
//     additional: 0,
//     higher: 0,
//     total: 0,
//   });
// });
// ${convertToPence("8840")} | ${convertToPence("91170")} | ${{ basic: 267750, higher: 1616095, additional: 0, total: 1883845 }}
test.each`
  salaryDrawdown            | dividendDrawdown           | expected
  ${convertToPence("0")}    | ${convertToPence("0")}     | ${{ basic: 0, higher: 0, additional: 0, total: 0 }}
  ${convertToPence("8840")} | ${convertToPence("0")}     | ${{ basic: 0, higher: 0, additional: 0, total: 0 }}
  ${convertToPence("8840")} | ${convertToPence("2000")}  | ${{ basic: 0, higher: 0, additional: 0, total: 0 }}
  ${convertToPence("8840")} | ${convertToPence("5730")}  | ${{ basic: 0, higher: 0, additional: 0, total: 0 }}
  ${convertToPence("8840")} | ${convertToPence("5740")}  | ${{ basic: 75, higher: 0, additional: 0, total: 75 }}
  ${convertToPence("8840")} | ${convertToPence("10000")} | ${{ basic: 32025, higher: 0, additional: 0, total: 32025 }}
  ${convertToPence("8840")} | ${convertToPence("30000")} | ${{ basic: 182025, higher: 0, additional: 0, total: 182025 }}
  ${convertToPence("8840")} | ${convertToPence("41430")} | ${{ basic: 267750, higher: 0, additional: 0, total: 267750 }}
  ${convertToPence("8840")} | ${convertToPence("41434")} | ${{ basic: 267750, higher: 130, additional: 0, total: 267880 }}
  ${convertToPence("8840")} | ${convertToPence("70000")} | ${{ basic: 267750, higher: 928525, additional: 0, total: 1196275 }}
  ${convertToPence("8840")} | ${convertToPence("91160")} | ${{ basic: 267750, higher: 1616225, additional: 0, total: 1883975 }}
  ${convertToPence("8840")} | ${convertToPence("98618")} | ${{ basic: 267750, higher: 1979802.5, additional: 0, total: 2247552.5 }}
`(
  "returns $expected when salaryDrawdown is $salaryDrawdown and dividendDrawdown is $dividendDrawdown",
  ({ salaryDrawdown, dividendDrawdown, expected }) => {
    expect(getDividendTaxes({ salaryDrawdown, dividendDrawdown })).toEqual(
      expected
    );
  }
);
