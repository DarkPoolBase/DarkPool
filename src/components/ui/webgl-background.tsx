import { useEffect, useRef, useCallback } from "react";

const VERTEX_SHADER = `
  attribute vec4 aVertexPosition;
  void main() { gl_Position = aVertexPosition; }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_mouseActive;

  float hash(float n) { return fract(sin(n)*753.5453123); }
  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix(hash(i), hash(i+1.0), f);
  }

  vec2 sdLine(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
  }

  float lightning(vec2 uv, vec2 a, vec2 b, float t) {
    vec2 ab = b - a;
    float len = length(ab);
    if(len < 0.01) return 0.0;
    vec2 dir = ab / len;
    vec2 pa = uv - a;
    float h = clamp(dot(pa, dir) / len, 0.0, 1.0);
    float dist = length(pa - dir * (h * len));
    float env = sin(h * 3.1415);
    float offset = (noise(h * 20.0 - t * 25.0) - 0.5) * 0.1 * env;
    offset += (noise(h * 50.0 + t * 40.0) - 0.5) * 0.03 * env;
    float d = abs(dist + offset);
    return (0.0002 / (d + 0.0002) + 0.00001 / (d*d + 0.00001)) * env;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 mouseUV = u_mouse / u_resolution.xy;
    mouseUV = mouseUV * 2.0 - 1.0;
    mouseUV.x *= u_resolution.x / u_resolution.y;

    vec2 center = vec2(-0.7, -0.3);
    center.x += sin(u_time * 0.3) * 0.04;
    center.y += cos(u_time * 0.2) * 0.04;

    vec2 dirUp = normalize(vec2(0.2, 1.0));
    vec2 dirRight = normalize(vec2(1.0, -0.15));
    vec2 dirDownLeft = normalize(vec2(-0.9, -0.5));

    vec2 l1 = sdLine(uv, center, center + dirUp * 5.0);
    vec2 l2 = sdLine(uv, center, center + dirRight * 5.0);
    vec2 l3 = sdLine(uv, center, center + dirDownLeft * 5.0);

    float intensity = 0.003;
    float glow = intensity / (l1.x + 0.001) +
                 intensity / (l2.x + 0.001) +
                 (intensity * 0.3) / (l3.x + 0.001);

    float pulse1 = smoothstep(0.1, 0.0, abs(l1.y - fract(u_time * 0.3))) * 0.04 / (l1.x + 0.001);
    float pulse2 = smoothstep(0.1, 0.0, abs(l2.y - fract(u_time * 0.4 + 0.5))) * 0.04 / (l2.x + 0.001);
    float pulse3 = smoothstep(0.1, 0.0, abs(l3.y - fract(u_time * 0.2 + 0.8))) * 0.02 / (l3.x + 0.001);
    glow += pulse1 + pulse2 + pulse3;

    vec2 p1 = center + dirUp * clamp(dot(mouseUV - center, dirUp), 0.0, 5.0);
    vec2 p2 = center + dirRight * clamp(dot(mouseUV - center, dirRight), 0.0, 5.0);
    vec2 p3 = center + dirDownLeft * clamp(dot(mouseUV - center, dirDownLeft), 0.0, 5.0);

    float lgt1 = lightning(uv, p1, mouseUV, u_time);
    float lgt2 = lightning(uv, p2, mouseUV, u_time + 15.0);
    float lgt3 = lightning(uv, p3, mouseUV, u_time + 25.0);

    float flicker = step(0.15, noise(u_time * 40.0)) * (noise(u_time * 100.0) * 0.7 + 0.3);

    float d1 = length(mouseUV - p1);
    float d2 = length(mouseUV - p2);
    float d3 = length(mouseUV - p3);

    glow += lgt1 * smoothstep(2.5, 0.0, d1) * u_mouseActive * flicker;
    glow += lgt2 * smoothstep(2.5, 0.0, d2) * u_mouseActive * flicker;
    glow += lgt3 * smoothstep(2.5, 0.0, d3) * u_mouseActive * flicker;

    float distToCenter = length(uv - center);
    glow += 0.04 / (distToCenter + 0.02);

    vec3 baseColor = vec3(0.6, 0.5, 1.0);
    vec3 finalColor = baseColor * glow;
    finalColor *= 0.8 + 0.2 * sin(u_time * 1.5 - distToCenter * 6.0);

    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += n * 0.015;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, lastMove: 0, active: 0 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = window.innerHeight - e.clientY;
    mouseRef.current.lastMove = Date.now();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    window.addEventListener("mousemove", handleMouseMove);

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);

    const vertexPos = gl.getAttribLocation(program, "aVertexPosition");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uMouseActive = gl.getUniformLocation(program, "u_mouseActive");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

    const startTime = Date.now();

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPos);

      const m = mouseRef.current;
      const timeSinceMove = Date.now() - m.lastMove;
      const targetActive = timeSinceMove < 150 ? 1.0 : Math.max(0, 1.0 - (timeSinceMove - 150) / 350);
      m.active += (targetActive - m.active) * 0.1;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, (Date.now() - startTime) * 0.001);
      gl.uniform2f(uMouse, m.x, m.y);
      gl.uniform1f(uMouseActive, m.active);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030305_100%)]" />
    </div>
  );
}
