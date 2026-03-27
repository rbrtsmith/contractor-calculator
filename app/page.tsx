"use client";

import { useState } from "react";
import { InsideIR35Form } from "./InsideIR35Form";
import { OutsideIR35Form } from "./OutsideIR35Form";

const Home = () => {
  const [activeTab, setActiveTab] = useState<"outside" | "inside">("outside");

  return (
    <main>
      <div className="flex flex-col justify-center text-center pt-10 px-4">
        <div className="mb-8">
          <a
            href="https://www.buymeacoffee.com/rbrtsmith"
            target="_blank"
            rel="noreferrer"
            className="inline-block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style={{ height: "50px", width: "181px" }}
            />
          </a>
        </div>
        <h1 className="leading-none text-[72px] bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 font-extrabold mb-6">
          Contractor income calculator
        </h1>
        <div className="w-full max-w-xl mx-auto mt-8">
          <div className="tab-bar">
            <button
              onClick={() => setActiveTab("outside")}
              className={
                activeTab === "outside"
                  ? "tab-button tab-button-active"
                  : "tab-button"
              }
            >
              Outside IR35
            </button>
            <button
              onClick={() => setActiveTab("inside")}
              className={
                activeTab === "inside"
                  ? "tab-button tab-button-active"
                  : "tab-button"
              }
            >
              Inside IR35
            </button>
          </div>
        </div>

        <OutsideIR35Form hidden={activeTab !== "outside"} />
        <InsideIR35Form hidden={activeTab !== "inside"} />
      </div>
    </main>
  );
};

export default Home;
