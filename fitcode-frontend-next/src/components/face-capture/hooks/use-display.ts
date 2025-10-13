import { useEffect, useRef, useState } from 'react';
import { resizeCanvasToDisplaySize } from '../actions/actions-canvas';

export type UseFaceCaptureDisplayReturnType = ReturnType<
  typeof useFaceCaptureDisplay
>;

export default function useFaceCaptureDisplay() {
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // observe stage size and keep canvases in sync
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => {
      if (overlayRef.current) resizeCanvasToDisplaySize(overlayRef.current);
      if (drawRef.current) resizeCanvasToDisplaySize(drawRef.current);
    });
    ro.observe(stageRef.current);
    // kick once initially
    if (overlayRef.current) resizeCanvasToDisplaySize(overlayRef.current);
    if (drawRef.current) resizeCanvasToDisplaySize(drawRef.current);
    return () => ro.disconnect();
  }, []);

  return {
    viewport,
    setViewport,
    stageRef,
    overlayRef,
    drawRef,
  };
}
