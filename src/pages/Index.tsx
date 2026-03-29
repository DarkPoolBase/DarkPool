import { useState } from "react";
import { motion } from "framer-motion";
import { IntroLoader } from "@/components/IntroLoader";

const Index = () => {
  const [loaderDone, setLoaderDone] = useState(false);

  return (
    <>
      {!loaderDone && <IntroLoader onComplete={() => setLoaderDone(true)} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaderDone ? 1 : 0 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        className="w-full h-screen"
      >
        <iframe
          src="/aero.html"
          className="w-full h-screen border-0"
          title="Aero | Visual Web Development"
        />
      </motion.div>
    </>
  );
};

export default Index;
