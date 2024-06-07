export const AnimatedDots = () => {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`dot dot-${i + 1} relative`}>
          .
        </div>
      ))}
    </>
  );
};
