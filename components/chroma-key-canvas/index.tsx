"use client";

import { useEffect, useRef } from "react";

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

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
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

type Props = {
  src: string;
  isVideo?: boolean;
  className?: string;
  poster?: string;
};

export function ChromaKeyCanvas({ src, isVideo, className, poster }: Props) {
  // Optimisation: track last rendered video time to skip duplicate frames
  const lastVideoTimeRef = useRef<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let positionBuffer: WebGLBuffer | null = null;
    let texCoordBuffer: WebGLBuffer | null = null;
    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;

    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);
      if (mediaElement instanceof HTMLVideoElement) {
        mediaElement.pause();
        mediaElement.removeAttribute("src");
        mediaElement.load();
      }
      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
        
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };

    try {
      gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
      if (!gl) return cleanup;

      program = gl.createProgram();
      if (!program) return cleanup;
      
      vs = compileShader(gl, gl.VERTEX_SHADER, VS);
      fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);
      
      if (!vs || !fs) return cleanup;

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Program link error", gl.getProgramInfoLog(program));
        return cleanup;
      }
      
      gl.useProgram(program);

      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0,
        ]),
        gl.STATIC_DRAW
      );

      texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          0.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          1.0, 1.0,
        ]),
        gl.STATIC_DRAW
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

        if (intrinsicWidth > 0 && intrinsicHeight > 0 && (canvas.width !== intrinsicWidth || canvas.height !== intrinsicHeight)) {
          canvas.width = intrinsicWidth;
          canvas.height = intrinsicHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }

        if (mediaElement instanceof HTMLVideoElement && mediaElement.readyState >= 2) {
          // Skip frame if video time hasn't advanced (saves GPU work)
          const currentTime = mediaElement.currentTime;
          if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaElement);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
        } else if (mediaElement instanceof HTMLImageElement && mediaElement.complete && mediaElement.naturalWidth > 0) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaElement);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        if (isVideo) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      if (isVideo) {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = src;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = "auto";
        // Decode at normal speed — avoids GPU spike on first frame
        video.playbackRate = 1;
        if (poster) video.poster = poster;
        video.play().catch(() => {});
        mediaElement = video;

        // Pause rendering when off-screen to save GPU/CPU
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                video.play().catch(() => {});
                animationFrameId = requestAnimationFrame(render);
              } else {
                video.pause();
                cancelAnimationFrame(animationFrameId);
              }
            }
          },
          { threshold: 0.05 }
        );
        observer.observe(canvas);

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
    }

    return cleanup;
  }, [src, isVideo, poster, className]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
