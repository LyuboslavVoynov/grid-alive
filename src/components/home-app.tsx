"use client";
import {useState} from "react";
import {Workspace} from "./product-nav";
import {TariffEditor} from "./tariff-editor";
import {TaskPlanner} from "./task-planner";
import {WholesaleContext} from "./wholesale-context";
import type {Tariff} from "@/lib/home/energy";
export default function HomeApp(){const [tab,setTab]=useState<"tariff"|"planner">("tariff"),[tariff,setTariff]=useState<Tariff|null>(null);return <Workspace active="home" title="Make your energy work for you" intro="Understand your rates, find useful windows and make informed choices about your electricity."><div className="home-tabs tab-strip" aria-label="Your home views"><button aria-pressed={tab==="tariff"} onClick={()=>setTab("tariff")}>Your tariff</button><button aria-pressed={tab==="planner"} onClick={()=>setTab("planner")}>Task planner</button></div>{tab==="tariff"?<><TariffEditor tariff={tariff} onSave={setTariff}/>{tariff&&<button className="text-button" onClick={()=>setTab("planner")}>Continue to the task planner ↗</button>}<WholesaleContext/></>:<TaskPlanner tariff={tariff} onTariff={()=>setTab("tariff")}/>}</Workspace>;}
