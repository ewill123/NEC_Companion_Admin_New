"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import liberiaGeoJSON from "../geojson/gadm41_LBR_1.json";
import { supabase } from "../supabaseClient";

const WIDTH = 1000;
const HEIGHT = 600;
const CHART_H = 350;
const CHART_BOTTOM = 60;

const LiberiaMap = () => {
  const mapRef = useRef(null);
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const projectionRef = useRef(null);
  const chartDataRef = useRef({}); // store previous counts

  const [reports, setReports] = useState([]);
  const countyList = liberiaGeoJSON.features.map((f) => f.properties.NAME_1);

  // ---- Fetch reports every 3 seconds ----
  useEffect(() => {
    let mounted = true;

    const fetchReports = async () => {
      const { data, error } = await supabase.from("issues").select("*");
      if (!error && data && mounted) setReports(data);
    };

    fetchReports();
    const interval = setInterval(fetchReports, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ---- Draw static base map once ----
  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    svg.attr("width", WIDTH).attr("height", HEIGHT);

    const projection = d3
      .geoMercator()
      .fitSize([WIDTH, HEIGHT], liberiaGeoJSON);
    projectionRef.current = projection;
    const path = d3.geoPath().projection(projection);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Tooltip styles
    d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.9)")
      .style("color", "#fff")
      .style("padding", "10px 14px")
      .style("borderRadius", "8px")
      .style("fontSize", "13px")
      .style("fontWeight", "500")
      .style("pointerEvents", "none")
      .style("opacity", 0);

    // Draw counties
    svg
      .append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(liberiaGeoJSON.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d, i) => colorScale(i))
      .attr("stroke-width", 1.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 3);
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`<strong>${d.properties.NAME_1}</strong>`)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        d3.select(tooltipRef.current)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1.5);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

    // Pins layer
    svg.append("g").attr("class", "pins").raise();
  }, []);

  // ---- Update pins every time reports change ----
  useEffect(() => {
    if (!mapRef.current) return;

    const svg = d3.select(mapRef.current);
    const pinsGroup = svg.select(".pins");
    pinsGroup.selectAll("*").remove();

    const projection =
      projectionRef.current ||
      d3.geoMercator().fitSize([WIDTH, HEIGHT], liberiaGeoJSON);

    reports.forEach((report) => {
      if (!report.location) return;

      const coords = [report.location.longitude, report.location.latitude];
      const projected = projection(coords);
      if (!projected) return;

      const [x, y] = projected;

      const pinGroup = pinsGroup
        .append("g")
        .attr("transform", `translate(${x},${y})`);
      const glow = pinGroup
        .append("circle")
        .attr("r", 14)
        .attr("fill", "#ff4757")
        .style("opacity", 0.7);

      const pulse = (circle) => {
        circle
          .transition()
          .duration(1200)
          .ease(d3.easeSin)
          .attr("r", 28)
          .style("opacity", 0.4)
          .transition()
          .duration(1200)
          .ease(d3.easeSin)
          .attr("r", 14)
          .style("opacity", 0.7)
          .on("end", () => pulse(circle));
      };
      pulse(glow);

      pinGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "20px")
        .attr("fill", "#fff")
        .text("📍");
    });

    pinsGroup.raise();
  }, [reports]);

  // ---- Update chart every time reports change ----
  useEffect(() => {
    if (!chartRef.current) return;

    const svg = d3.select(chartRef.current);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    const counts = Object.fromEntries(countyList.map((c) => [c, 0]));

    reports.forEach((report) => {
      if (!report.location) return;
      for (const county of liberiaGeoJSON.features) {
        if (
          d3.geoContains(county, [
            report.location.longitude,
            report.location.latitude,
          ])
        ) {
          counts[county.properties.NAME_1]++;
          break;
        }
      }
    });

    const barScale = d3
      .scaleLinear()
      .domain([0, d3.max(Object.values(counts)) || 1])
      .range([0, CHART_H - CHART_BOTTOM - 20]);
    const barWidth = Math.floor(WIDTH / countyList.length) - 10;

    countyList.forEach((county, i) => {
      const newCount = counts[county];
      const barHeight = barScale(newCount);
      const x = i * (barWidth + 10);

      // Append bar if doesn't exist
      let rect = svg.select(`#bar-${i}`);
      if (rect.empty()) {
        rect = svg
          .append("rect")
          .attr("id", `bar-${i}`)
          .attr("x", x)
          .attr("y", CHART_H - CHART_BOTTOM)
          .attr("width", barWidth)
          .attr("height", 0)
          .attr("fill", colorScale(i))
          .on("mouseover", (event) => {
            d3.select(tooltipRef.current)
              .style("opacity", 1)
              .html(`<strong>${county}</strong>`) // ✅ only county name
              .style("left", event.pageX + 12 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mousemove", (event) => {
            d3.select(tooltipRef.current)
              .style("left", event.pageX + 12 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", () =>
            d3.select(tooltipRef.current).style("opacity", 0)
          );
      }

      // Animate bar
      rect
        .transition()
        .duration(1000)
        .attr("y", CHART_H - CHART_BOTTOM - barHeight)
        .attr("height", barHeight)
        .ease(d3.easeCubic);

      // Value text
      let valueText = svg.select(`#value-${i}`);
      if (valueText.empty()) {
        valueText = svg
          .append("text")
          .attr("id", `value-${i}`)
          .attr("x", x + barWidth / 2)
          .attr("text-anchor", "middle")
          .attr("font-weight", "700")
          .attr("font-size", "12px")
          .attr("fill", "#111");
      }

      valueText
        .transition()
        .duration(1000)
        .attr("y", CHART_H - CHART_BOTTOM - barHeight - 5)
        .text(newCount);

      // County labels
      if (!svg.select(`#label-${i}`).node()) {
        svg
          .append("text")
          .attr("id", `label-${i}`)
          .attr("x", x + barWidth / 2)
          .attr("y", CHART_H - CHART_BOTTOM + 5)
          .attr("text-anchor", "end")
          .attr(
            "transform",
            `rotate(-60, ${x + barWidth / 2}, ${CHART_H - CHART_BOTTOM + 5})`
          )
          .attr("font-weight", "700")
          .attr("font-size", "12px")
          .attr("fill", "#111")
          .text(county);
      }

      chartDataRef.current[county] = newCount;
    });
  }, [reports, countyList]);

  return (
    <div className="flex flex-col items-center gap-12 py-12 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center gap-8 w-full max-w-[1200px]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full">
          <svg ref={mapRef} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full overflow-x-auto">
          <svg ref={chartRef} width={WIDTH} height={CHART_H} />
        </div>
      </div>
      <div ref={tooltipRef} />
    </div>
  );
};

export default LiberiaMap;
