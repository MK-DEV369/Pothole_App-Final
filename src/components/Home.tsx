"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import type { PotholeReport } from "../types/database.types"

const ReportHistory: React.FC = () => {
  const [reports, setReports] = useState<PotholeReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pothole_reports")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="p-6 bg-white-50 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6 tracking-tight">Reported Problems</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Loading reports...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
          {reports.length > 0 ? (
            reports.slice(0, 6).map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg h-max shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] border border-gray-200"
              >
                {report.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={report.image_url || "/placeholder.svg"}
                      alt={report.description || "Pothole image"}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full text-white
                        ${
                          report.severity === "high"
                            ? "bg-red-500"
                            : report.severity === "medium"
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                    >
                      {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)} Severity
                    </div>
                  </div>
                )}
                <div className="p-5 bg-sky-950">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {report.description || "No description provided"}
                  </h3>
                  {report.latitude && <p className="text-sm text-white mb-2">Latitude: {report.latitude}</p>}
                  {report.longitude && <p className="text-sm text-white mb-2">Longitude:  {report.longitude}</p>}
                  <div className="text-xs text-white mt-3 pt-3 border-t border-gray-100">
                    Reported on:{" "}
                    {new Date(report.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500">No pothole reports found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportHistory
