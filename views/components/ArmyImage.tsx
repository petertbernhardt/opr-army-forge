const rotations = {} as any;

export default function ArmyImage({
  imageUrl = null,
  armyData = null,
  name = null,
  size = "100px",
  ...props
}) {
  const urlName = name
    .replace(/Daemons of.+/gi, "Daemons")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const directory = (() => {
    if (urlName === "jackals") return "2022/04";
    if (urlName === "havoc-war-clans") return "2022/05";
    return "2022/02";
  })();

  const url = imageUrl || `https://onepagerules.files.wordpress.com/${directory}/${urlName}.png`; // `img/${path}/${name}.png`;

  return (
    <div
      {...props}
      className={`${props.className ?? ""} is-flex p-2`}
      style={{
        ...props.style,
        position: "relative",
        height: size,
        flexBasis: size,
        boxSizing: "content-box",
      }}
    >
      <div
        style={{
          zIndex: 0,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("img/army_bg.png")`,
          backgroundPosition: "center",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          transform: `rotate(${rotations[name] || (rotations[name] = 360 * Math.random())}deg)`,
        }}
      ></div>
      <div
        className="is-flex"
        style={{
          height: "100%",
          width: "100%",
          backgroundImage: `url("${url}")`,
          backgroundPosition: "center",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          position: "relative",
          zIndex: 1,
        }}
      ></div>
    </div>
  );
}
