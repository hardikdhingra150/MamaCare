
import { Search, Filter } from 'lucide-react';

export default function SearchFilter({ 
  searchTerm, 
  onSearchChange, 
  riskFilter, 
  onRiskFilterChange,
  sortBy,
  onSortChange 
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-charcoal/40" />
        <input 
          type="search"
          placeholder="Search by name, phone, or village..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-cream-dark rounded-gentle focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Risk Filter */}
      <div className="relative">
        <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-charcoal/40" />
        <select 
          className="pl-12 pr-8 py-3 bg-white border border-cream-dark rounded-gentle focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 appearance-none cursor-pointer min-w-[180px]"
          value={riskFilter}
          onChange={(e) => onRiskFilterChange(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="HIGH">High Risk Only</option>
          <option value="MODERATE">Moderate Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* Sort */}
      <select 
        className="px-4 py-3 bg-white border border-cream-dark rounded-gentle focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 cursor-pointer min-w-[180px]"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="week">Sort by Week</option>
        <option value="name">Sort by Name</option>
        <option value="lastVisit">Sort by Last Visit</option>
        <option value="risk">Sort by Risk Level</option>
      </select>
    </div>
  );
}
