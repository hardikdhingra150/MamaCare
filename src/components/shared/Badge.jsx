export default function Badge({ risk }) {
    const styles = {
      HIGH: 'risk-badge-high',
      MODERATE: 'risk-badge-moderate',
      LOW: 'risk-badge-low',
    };
    
    return (
      <span className={styles[risk] || styles.LOW}>
        {risk} RISK
      </span>
    );
  }
  