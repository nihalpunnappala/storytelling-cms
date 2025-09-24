import styled from "styled-components";
import { appTheme } from "../../project/brand/project";
import { GetIcon } from "../../../icons";

const TileContainer = styled.div`
  display: flex;
  gap: 20px;
  padding: 0px;
  border: 1px solid ${appTheme.stroke.soft};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  box-shadow: 0px 1px 2px 0px #e4e5e73d;
  gap: 20px;
  border-radius: 16px;
  padding: 16px;
  flex-wrap: wrap;
`;

const Tile = styled.div`
  flex: 1;
  background: white;
  padding: 0px;
  display: flex;
  align-items: center;
  /* min-width: 200px; */
  border-right: 1px solid ${appTheme.stroke.soft};
  &:last-child {
    border-right: none;
  }
  @media (max-width: 768px) {
    border-right: 0px;
  }
`;

const TileContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: ${({ color }) => color || "black"};
`;

const IconWrapper = styled.div`
  background: #eef4ff;
  background-color: ${({ backgroundColor }) => backgroundColor || "#eef4ff"};
  padding: 16px;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ color }) => color || "#4f46e5"};
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.span`
  font-size: 11px;
  font-weight: 500;
  line-height: 12px;
  letter-spacing: 0.02em;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: ${appTheme.text.soft};
`;

const Value = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 19.36px;
  letter-spacing: -0.011em;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: ${appTheme.text.main};
`;

/**
 * MetricTile Component
 */
const MetricTile = ({ labels, data }) => {
  return (
    <TileContainer>
      {labels.map((label, index) => {
        const metricData = data?.[label.key] ?? {};
        return (
          <Tile key={label.key || index}>
            <TileContent color={label.color}>
              {label.icon?.length > 0 && (
                <IconWrapper backgroundColor={label.backgroundColor} color={label.color}>
                  <GetIcon icon={label.icon} />
                </IconWrapper>
              )}
              <TextContent>
                <Title>{label.title}</Title>
                <Value>
                  {label.key === "Total amount" ? (
                    <>
                      {typeof metricData.count === "string" ? (
                        // Multiple currencies case - count is already formatted as "KWD 1190 + INR 1000"
                        metricData.count
                      ) : (
                        // Single currency case
                        <>
                          {metricData.currency?.toUpperCase()} {metricData.count}
                        </>
                      )}
                      {metricData?.total && ` / ${metricData.total}`}
                      {metricData?.suffix && metricData.suffix}
                    </>
                  ) : (
                    <>
                      {metricData?.count}
                      {metricData?.total && ` / ${metricData.total}`}
                      {metricData?.suffix && metricData.suffix}
                    </>
                  )}
                </Value>
              </TextContent>
            </TileContent>
          </Tile>
        );
      })}
    </TileContainer>
  );
};

export default MetricTile;
