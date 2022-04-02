import { JSDOM } from "jsdom";
import mockConsole from "jest-mock-console";

import enhance from "./enhance";

const waitForEvents = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });

describe("enhance()", () => {
  it("enhances existing elements", () => {
    const { window: win } = new JSDOM(`<h1>Hello</h1><h2>world</h2>`);

    enhance(win);

    expect(win.document.querySelector("h1")).toBeShadowed(
      (shadowRoot: ShadowRoot) => {
        expect(shadowRoot.innerHTML).toBe("Hello, world!");
      },
    );
    expect(win.document.querySelector("h2")).not.toBeShadowed();
  });

  it("enhances elements added later", async () => {
    const { window: win } = new JSDOM();

    enhance(win);
    win.document.body.innerHTML = `<h1>Hello</h1><h2>world</h2>`;
    await waitForEvents();

    expect(win.document.querySelector("h1")).toBeShadowed(
      (shadowRoot: ShadowRoot) => {
        expect(shadowRoot.innerHTML).toBe("Hello, world!");
      },
    );

    expect(win.document.querySelector("h2")).not.toBeShadowed();
  });

  it("enhances children of elements added later", async () => {
    const { window: win } = new JSDOM(`<!DOCTYPE html>`);

    enhance(win);
    win.document.body.innerHTML = `<div><h1>Hello</h1><h2>world</h2></div>`;
    await waitForEvents();

    expect(win.document.querySelector("h1")).toBeShadowed(
      (shadowRoot: ShadowRoot) => {
        expect(shadowRoot.innerHTML).toBe("Hello, world!");
      },
    );

    expect(win.document.querySelector("h2")).not.toBeShadowed();
  });

  it("ignores already-shadowed elements", () => {
    const { window: win } = new JSDOM(`<h1>Hello</h1>`);
    const h1 = win.document.querySelector("h1");
    if (!h1) throw "h1 was expected but not found";
    const shadowRoot = h1.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = "Hi there.";
    const restoreConsole = mockConsole("error");

    enhance(win);

    expect(h1).toBeShadowed((shadowRoot: ShadowRoot) => {
      expect(shadowRoot.innerHTML).toBe("Hi there.");
    });
    expect(console.error).toHaveBeenCalledWith(
      "Element already has a shadowRoot:",
      h1,
    );

    restoreConsole();
  });

  it("re-shadows an element it has already shadowed", () => {
    const { window: win } = new JSDOM(`<h1>Hello</h1>`);
    const h1 = win.document.querySelector("h1");
    enhance(win);
    const restoreConsole = mockConsole("error");

    enhance(win);

    expect(h1).toBeShadowed((shadowRoot: ShadowRoot) => {
      expect(shadowRoot.innerHTML).toBe("Hello, world!");
    });
    expect(console.error).not.toHaveBeenCalled();

    restoreConsole();
  });
});