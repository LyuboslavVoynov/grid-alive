import { describe, it, expect } from "vitest";
import { series } from "../src/lib/data/insights";
describe("published insight series",()=>{
 it("deduplicates revisions and rejects invalid or negative observations",()=>{
  const data={data:[{startTime:"2026-11-11T12:00Z",publishTime:"2026-11-11T11:00Z",nationalDemand:20},{startTime:"2026-11-11T12:00Z",publishTime:"2026-11-11T11:30Z",nationalDemand:30},{startTime:"bad",nationalDemand:40},{startTime:"2026-11-11T13:00Z",nationalDemand:-1}]};
  expect(series(data,"nationalDemand")).toEqual([{at:"2026-11-11T12:00Z",publishedAt:"2026-11-11T11:30Z",value:30}]);
 });
 it("does not retain expired forecast periods",()=>expect(series({data:[{startTime:"2026-11-10T12:00Z",generation:20},{startTime:"2026-11-11T13:00Z",generation:30}]},"generation",Date.parse("2026-11-11T12:00Z"),true)).toHaveLength(1));
});
