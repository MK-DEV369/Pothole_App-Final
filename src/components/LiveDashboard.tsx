import React , { useState,  useEffect, useCallback} from 'react';
import Map from './Map';
import { supabase } from '../lib/supabase';

import type { PotholeReport } from '../types/database.types';
{/* Reported Potholes Map */}
const LiveDashboard: React.FC = () => {
    const [reports, setReports] = useState<PotholeReport[]>([]);
    const [loading, setLoading] = useState(true);
    
      useEffect(() => {
        fetchReports();
      }, []);
    
      const fetchReports = useCallback(async () => {
        try {
          const { data, error } = await supabase
            .from('pothole_reports')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setReports(data || []);
        } catch (error) {
          console.error('Error fetching reports:', error);
        } finally {
          setLoading(false);
        }
      }, []);
  return (
    
    <div className="container mx-auto px-4 py-8 h-screen">      
      <div className="bg-gray-200 rounded-lg p-2">
        <Map reports={reports} filter="all" />
      </div>
    </div>
  );
};

export default LiveDashboard;