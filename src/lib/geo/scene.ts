export type Point = [number, number];
export type Coast = { name: string; rings: Point[][] };
export const cities: [number, number, number, string][] = [
  [-0.127, 51.507, 1.5, "London"],
  [-1.9, 52.486, 0.8, "Birmingham"],
  [-2.24, 53.48, 0.8, "Manchester"],
  [-3, 53.4, 0.55, "Liverpool"],
  [-1.55, 53.8, 0.65, "Leeds"],
  [-1.61, 54.98, 0.45, "Newcastle"],
  [-4.25, 55.86, 0.65, "Glasgow"],
  [-3.19, 55.95, 0.45, "Edinburgh"],
  [-2.59, 51.45, 0.5, "Bristol"],
  [-3.18, 51.48, 0.4, "Cardiff"],
  [-1.4, 50.9, 0.4, "Southampton"],
  [-1.15, 52.95, 0.4, "Nottingham"],
  [-1.47, 53.38, 0.4, "Sheffield"],
  [-4.14, 50.37, 0.25, "Plymouth"],
  [-2.1, 57.15, 0.22, "Aberdeen"],
  [-4.22, 57.48, 0.15, "Inverness"],
  [1.3, 52.63, 0.2, "Norwich"],
];
export const connectionPaths: { id: string; name: string; points: Point[] }[] =
  [
    {
      id: "INTFR",
      name: "France",
      points: [
        [1.65, 50.95],
        [1, 50.8],
        [0.1, 51.05],
      ],
    },
    {
      id: "INTNED",
      name: "Netherlands",
      points: [
        [3.5, 51.8],
        [2.7, 52.2],
        [1.15, 51.95],
      ],
    },
    {
      id: "INTNSL",
      name: "Norway",
      points: [
        [5.3, 58.2],
        [2.1, 57.7],
        [-1.5, 55.2],
      ],
    },
    {
      id: "INTEW",
      name: "Ireland",
      points: [
        [-6.1, 53.4],
        [-5.3, 53.1],
        [-4.1, 53.2],
      ],
    },
  ];
