import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

const InstaRecapUserGraph = ({ data = [], loading = false }) => {
  return (
    <>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading user graph data...</p>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-lg font-semibold text-gray-800">No user graph data</p>
        </div>
      )}
    </>
  );
};

export default InstaRecapUserGraph;
