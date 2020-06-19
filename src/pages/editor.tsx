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
    <div>
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
          <div dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      </div>
      <button className="submit" onClick={handleClick}>
        送信({env()})
      </button>
      <style jsx>{`
        .wrapper {
          display: flex;
          align-items: center;
          padding: 8px;
          background-color: #ebecf0;
          height: 100vh;
        }
        .monaco-wrapper {
          width: 50%;
          height: 80vh;
          border-radius: 4px;
          margin-right: 8px;
          box-shadow: -2px -2px 5px rgba(255, 255, 255, 1),
            3px 3px 5px rgba(0, 0, 0, 0.1);
        }
        .preview {
          width: 50%;
          height: 30%;
        }
        .submit {
          display: block;
          margin: 16px auto;
          border: solid 1px black;
        }
      `}</style>
    </div>
  );
}
