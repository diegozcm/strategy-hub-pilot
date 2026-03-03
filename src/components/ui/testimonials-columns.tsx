"use client";
import React from "react";
import { motion } from "motion/react";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${index}-${i}`}
                className="rounded-2xl border border-cofound-blue-dark/[0.06] bg-white p-6 shadow-soft hover:shadow-elev transition-shadow duration-300"
              >
                <p className="text-sm text-cofound-blue-dark/60 font-sans leading-relaxed">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-cofound-green/20"
                  />
                  <div>
                    <p className="text-sm font-display font-semibold text-cofound-blue-dark leading-tight">
                      {name}
                    </p>
                    <p className="text-xs text-cofound-blue-dark/40 font-sans">
                      {role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
