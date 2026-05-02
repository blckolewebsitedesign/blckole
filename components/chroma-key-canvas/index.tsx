"use client";

import { getPreloadedVideoSrc } from "lib/video-preload";
import { useEffect, useRef, useState } from "react";

const VS = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    // Flip Y-axis since WebGL expects bottom-left origin for textures
    v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
  }
`;

const FS = `
  precision highp float;
  uniform sampler2D u_texture;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    // Find the max of Red and Blue
    float maxRB = max(color.r, color.b);

    // Difference between Green and the max of R/B
    float difference = color.g - maxRB;

    // Calculate alpha based on how "green" the pixel is.
    // Tweak the 0.05 and 0.20 to change the hardness of the key.
    float alpha = 1.0 - smoothstep(0.05, 0.20, difference);

    // Despill: Remove the green tint from the edges of the subject
    color.g = min(color.g, maxRB * 1.1);

    // Output with premultiplied alpha
    gl_FragColor = vec4(color.rgb * alpha, color.a * alpha);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Shader compile error", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

type Quality = "high" | "thumb";

type Props = {
  src: string;
  isVideo?: boolean;
  className?: string;
  poster?: string;
  paused?: boolean;
  quality?: Quality;
};

export function ChromaKeyCanvas({
  src,
  isVideo,
  className,
  poster,
  paused,
  quality = "high",
}: Props) {
  const lastVideoTimeRef = useRef<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const pausedRef = useRef<boolean>(!!paused);
  const qualityRef = useRef<Quality>(quality);
  const [useFallback, setUseFallback] = useState(false);

  // Keep refs in sync without tearing down GL context.
  useEffect(() => {
    pausedRef.current = !!paused;
    const video = videoElRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => {});
    }
  }, [paused]);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    lastVideoTimeRef.current = -1;
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.objectFit = "contain";
    canvas.style.objectPosition = "bottom center";

    if (className) canvas.className = className;

    container.appendChild(canvas);

    let animationFrameId: number;
    let mediaElement: HTMLVideoElement | HTMLImageElement;
    let video: HTMLVideoElement | null = null;
    let videoFirstFrameReady = false;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let positionBuffer: WebGLBuffer | null = null;
    let texCoordBuffer: WebGLBuffer | null = null;
    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;

    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      }
      videoElRef.current = null;
      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);

        const loseContext = gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };

    try {
      gl = canvas.getContext("webgl", {
        premultipliedAlpha: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      if (!gl) {
        setUseFallback(true);
        return cleanup;
      }

      program = gl.createProgram();
      if (!program) {
        setUseFallback(true);
        return cleanup;
      }

      vs = compileShader(gl, gl.VERTEX_SHADER, VS);
      fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);

      if (!vs || !fs) {
        setUseFallback(true);
        return cleanup;
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Program link error", gl.getProgramInfoLog(program));
        setUseFallback(true);
        return cleanup;
      }

      gl.useProgram(program);

      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        ]),
        gl.STATIC_DRAW,
      );

      texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
        ]),
        gl.STATIC_DRAW,
      );

      const posLocation = gl.getAttribLocation(program, "a_position");
      if (posLocation !== -1) {
        gl.enableVertexAttribArray(posLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);
      }

      const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
      if (texCoordLocation !== -1) {
        gl.enableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
      }

      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const render = () => {
        if (!gl || !canvas || !mediaElement) return;

        let intrinsicWidth = 0;
        let intrinsicHeight = 0;
        if (mediaElement instanceof HTMLVideoElement) {
          intrinsicWidth = mediaElement.videoWidth;
          intrinsicHeight = mediaElement.videoHeight;
        } else {
          intrinsicWidth = mediaElement.naturalWidth;
          intrinsicHeight = mediaElement.naturalHeight;
        }

        // Apply quality scaling. Thumb halves both dimensions, slashing the
        // texImage2D cost — meaningful when 10+ thumbnails are on screen.
        const qScale = qualityRef.current === "thumb" ? 0.5 : 1;
        const targetW = Math.max(1, Math.round(intrinsicWidth * qScale));
        const targetH = Math.max(1, Math.round(intrinsicHeight * qScale));

        if (
          intrinsicWidth > 0 &&
          intrinsicHeight > 0 &&
          (canvas.width !== targetW || canvas.height !== targetH)
        ) {
          canvas.width = targetW;
          canvas.height = targetH;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        if (
          mediaElement instanceof HTMLVideoElement &&
          mediaElement.readyState >= 2
        ) {
          // Skip frame if video time hasn't advanced (saves GPU work).
          // While paused this also stops the GPU work entirely.
          const currentTime = mediaElement.currentTime;
          if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              mediaElement,
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
        } else if (
          mediaElement instanceof HTMLImageElement &&
          mediaElement.complete &&
          mediaElement.naturalWidth > 0
        ) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            mediaElement,
          );
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // Reduced-motion: render the first frame then stop the rAF loop.
        // When paused, video.pause() freezes currentTime and the dedupe
        // check above skips texImage2D/drawArrays — so the loop stays cheap.
        if (isVideo && !reduceMotion) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      if (isVideo) {
        video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = getPreloadedVideoSrc(src) ?? src;
        video.loop = true;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = "auto";
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");

        // Mobile Safari strongly prefers the <video> to be in the DOM to autoplay
        video.style.position = "absolute";
        video.style.width = "1px";
        video.style.height = "1px";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        document.body.appendChild(video);

        video.onerror = () => {
          if (video && video.src.startsWith("blob:")) {
            console.warn(
              "Blob video failed on iOS, falling back to network src:",
              src,
            );
            video.src = src;
            video.load();
            video.play().catch(() => {});
          }
        };

        video.playbackRate = 1;
        mediaElement = video;
        videoElRef.current = video;

        if (poster) {
          const posterImg = new Image();
          posterImg.crossOrigin = "anonymous";
          posterImg.src = poster;
          posterImg.onload = () => {
            if (!videoFirstFrameReady) mediaElement = posterImg;
          };
        }

        type RVFCVideo = HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: () => void) => number;
        };
        const v = video as RVFCVideo;
        const markReady = () => {
          videoFirstFrameReady = true;
          if (video) mediaElement = video;
        };
        if (typeof v.requestVideoFrameCallback === "function") {
          v.requestVideoFrameCallback(markReady);
        } else {
          video.addEventListener("loadeddata", markReady, { once: true });
        }

        if (pausedRef.current) {
          video.pause();
        } else {
          video.play().catch(() => {});
        }

        animationFrameId = requestAnimationFrame(render);
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
          mediaElement = img;
          render();
        };
      }
    } catch (e) {
      console.error("ChromaKeyCanvas WebGL error:", e);
      setUseFallback(true);
    }

    return cleanup;
  }, [src, isVideo, poster, className]);

  if (useFallback) {
    if (isVideo) {
      return (
        <video
          src={src}
          poster={poster}
          className={className}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
          }}
          autoPlay={!paused}
          loop
          muted
          playsInline
        />
      );
    }
    return (
      <img
        src={src}
        alt=""
        className={className}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
