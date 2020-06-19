import * as React from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import domtoimage from "dom-to-image";
import { saveOgp } from "../repository/postPng";
import { generateRandomId } from "../helper/util";
import env from "../helper/env";
import "../vendor/css/monaco.css";

const MonacoEditor = dynamic(import("react-monaco-editor"), { ssr: false });

export default function Editor() {
  const router = useRouter();
  const [text, edit] = React.useState(
    '<div style="background-color: yellow; height: 300px;"> \n<p style="color: blue;">はじめてのCSS</p></div>'
  );
  const ref = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    const imageId = generateRandomId();
    domtoimage
      .toPng(ref.current, {
        // NOTE: 画質対応
        // https://github.com/tsayen/dom-to-image/issues/69
        height: ref.current.offsetHeight * 2,
        style: {
          transform: `scale(${2}) translate(${
            ref.current.offsetWidth / 2 / 2
          }px, ${ref.current.offsetHeight / 2 / 2}px)`,
        },
        width: ref.current.offsetWidth * 2,
      })
      .then((dataURL) => {
        const img = new Image();
        img.src = dataURL;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1600;
          canvas.height = 600;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // canvasをblobに変換し、FileSaverでダウンロードを行う
          canvas.toBlob(async (blob) => {
            await saveOgp(imageId, blob);
            router.push(`/${imageId}`);
          });
        };
      })
      .catch(function (error) {
        console.error("oops, something went wrong!", error);
      });
  };

  return (
    <div className="container">
      <div className="wrapper">
        <div className="monaco-wrapper">
          <MonacoEditor
            language="html"
            // theme="vs"
            value={text}
            options={{ minimap: { enabled: false } }}
            onChange={edit}
            editorDidMount={() => {
              // @ts-ignore
              window.MonacoEnvironment.getWorkerUrl = (moduleId, label) => {
                if (label === "json") return "/_next/static/json.worker.js";
                if (label === "css") return "/_next/static/css.worker.js";
                if (label === "html") return "/_next/static/html.worker.js";
                if (label === "typescript" || label === "javascript")
                  return "/_next/static/ts.worker.js";
                return "/_next/static/editor.worker.js";
              };
            }}
          />
        </div>
        <div className="preview" ref={ref}>
          <div
            dangerouslySetInnerHTML={{ __html: text }}
            style={{ margin: "auto" }}
          />
        </div>
      </div>
      <button className="submit" onClick={handleClick}>
        <span>OGP画像を作成する</span>
        <img src="/airplane.svg" className="icon"></img>
      </button>
      <style jsx>{`
        .container {
          height: 100vh;
          background-color: #ebecf0;
        }
        .wrapper {
          display: flex;
          align-items: center;
          padding: 8px;
          height: 90vh;
          justify-content: space-evenly;
        }
        .monaco-wrapper {
          width: 45%;
          height: 80vh;
          border-radius: 4px;
          box-shadow: -2px -2px 5px rgba(255, 255, 255, 1),
            3px 3px 5px rgba(0, 0, 0, 0.1);
        }
        .preview {
          width: 45%;
          height: 50%;
          padding: 24px;
          background-color: white;
          border-radius: 12px;
          display: flex;
        }
        .submit {
          display: block;
          margin: 16px auto;
          box-shadow: -5px -5px 20px #fff, 5px 5px 20px #babecc;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          font-weight: 500;
          color: #2e87ff;
          order: 0;
          outline: 0;
          font-size: 16px;
          border-radius: 320px;
          padding: 16px 48px;
          background-color: #ebecf0;
          font-family: -apple-system, BlinkMacSystemFont,
            "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
        }
        .icon {
          width: 20px;
          height: 20px;
          margin-left: 12px;
          fill: red;
          color: red;
        }
      `}</style>
    </div>
  );
}
