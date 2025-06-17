import React from "react";
import Layout1 from "./layout";
import { theme, Layout, Col, Row } from "antd";
import { useNavigate } from "react-router-dom";
import { CloudTwoTone } from "@ant-design/icons";

const style = {
  background: '#fff',
  padding: '36px 20px',
  marginTop: '19px',
  marginRight: '25px',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '10px',
};

const { Content } = Layout;

export default function Zti({ children }) {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/servervirtualization"); // replace with your actual path
  };

  const handleRedirectAddNode = () => {
    navigate("/cloud"); // replace with your actual path
  };

  const handleRedirectRemoveNode = () => {
    navigate("/edgecloud"); // replace with your actual path
  };
  const handleDistributedStorage= () => {
    navigate("/distributedstorage"); // replace with your actual path
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout1>
      <Row
        gutter={16} // Added gutter for spacing
        justify="space-between" // Ensures equal spacing between the columns
        style={{ marginLeft: "20px" }} // Added marginLeft to shift everything a bit to the right
      >
        <Col
          className="gutter-row"
          span={5} // Each column takes up 7 spans, so 3 columns will total 21 spans
          onClick={handleRedirect}
          style={style}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
           <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACnElEQVR4nO1azWoUQRBuMIgeNGaz3V4igj8IvoBexKfYY6JvIIJTteBhbm68iw8RFm8q6EVZfYcknjYkgkpAk4u3T2rsLKuuYWa2ZzM9Wx/UpZfurqqvf+arXmMUCoVCocgNR7htCW8d4dAxUAsjHFrGm4td3DJVop3grmX8PPGA/2PiWzvBnWqi7+CUI2z5jD9bfIALpiYQXxzjufdtS3wNPollrI0mSLFg6oYUC46x7VfCWnj22Q+eYFWaHOPjDPf4hyNXJs7rfx+RxNgOugrsOPt+YJl0hvt7MErA5HkH1a2CTsb+5jj7dYYl3PNkfQqyVW3oAavGOGFTr4JOXOwHJ83Gxn7QVdCJk/1g5NkEq5VcKbPChKu7EBzhvV9C902kEN89ie8Kd3aMA+m8xFg0kUJ89wk4KNzZ1UDchDRNQFG4spmrGaZeASZyNDYBN1OcdoynjvDZMfYcYV3aKk+AEzk6Jk+raMvlH2HdX9NfxLy/vbxxTJMA/N0esu3YOsOfdYE9CXw5wTkxS/gqbfEngI6tMwwmJaCV4nyWAMJu9QmgzMFBlW05/euNtsBv9sXfJ3njaMoh2PMH4K4EH/YQJPyQji3CiokUS49xySfge+HOjtD3nV/JQCbG4Amv/eG5UXgA28U1y/h20t/w01oWQxdXCiegneB6UxJgH+Fq+S1AeBnjOSA+y/YtvQXc3B+CHMU1qFrAqhaAaoGWagGoFnCqBf6FagFSLQDVAqxaAKoFuExBhFULIJJ3gaHYvL4LDC+nOCNmCTvz+C4wlOBXHuJsloC5fBcg7Hj2xV99FzA5icz9F5lWhPXAIFrAEl406F2gX3iA5QQ3LGO/AWXxfSnxly8tEzaOKsRRmfhM6JcOXqFQKBSm+fgF8tw4l4opeaIAAAAASUVORK5CYII=" alt="server" style={{ width: "60px", height: "60px",  marginLeft: "30px", userSelect: "none" }}></img>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginLeft: "30px",
		userSelect: "none",
	      }}
            >
              Server Virtualization
            </span>
          </div>
        </Col>

        <Col
          className="gutter-row"
          span={5} // Each column takes up 7 spans
          onClick={handleRedirectAddNode}
          style={style}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADmElEQVR4nO2Y32tcVRDHj01/2J9Js3fOzYa2alsKBgspCiJVtEJLqy99CYrYPhYf+stsduZufbiiIBUUlP4BUSkKQqNgf1JUfGgLYvGhP6S2VBCkEam2TdOakvYr5+7sukl2k7i7afbK/cB9uPeeM2fmnJk5c44xCQkJCQkJjU6ImV6Ax63gVY+xkxjbbRabU1k8YbrQZBodP8CTVvCRZQxYAco9JPjDMnptgKdMo+HtQdoyPreCe0WlGT8R41Mr+NAK9hGjjxjnRhjF6KMerDCNgC94jhj9qvyfJHhr8RtYWqk9BVhJgjct47oa9BcF2Hh/tR6r1AZi3FaX+czPwE62b1sOpCvmjBkmwdap1bayIh0kuKkukqtOCh5wfZ1LEmOIBE+bqSAdYp7LNL7geecSxR/bMIsEZ9WIt2sdxwreUVn9zbvQUqu8fwUHWE6C/SS4NSrjnKcAXZaxW2PiOxNiRs0DhphBjK9V5t66GOECryQQh63gRxJ8Q4xfSoy6Zxl32xiP1mVQYwz1oNPJjCYvB79mYcQY1JnpdWm19L/L/c4wdYMva1V+NCT4Iho7wGumFqzghM74u5Xa+BnMJ8a3nuBFU2coiy06iUeqFuIJ1qiQiy6Yxx0wxIKJ2lSDn4HVWLxatZBCANcjC9UCaYJZ8jrm/ufOXhbPWMYPOhvTszEpJLjs9PAzeMRMFpcdigGWd6sBj7HJTCNW8JtO6PsuDjtCzB63gxdgVSGlullwgVbVctaTEDOt4M6ovet3CiBlY7I9QMoKLmnjA1HwNtA5hnJYawWvRJsyY0hj9/sxtZwVfKKudGwqsk89sfkq41ShsmgNsahY7OnOfD2VRbuJAQ+FeNCVQ2rM/ugjMd7TpfrAxAjqQZsV3Igq5R50Orc67QzxsnjWxAzL2FtcBHci0w2n1cQMP38n4Aw54zacv93Lyh2YY2JG8y60aKa95mLkV/cy3rm6UfEzmK8Bf9MZcjwqAQK8ZGKGn8NjuiI/O9faoVZ9ZWIGBZDCWcmku+EVToDuKsfEhHSIeYU6zAvwQvSRBIEu0RVf8LCJAZbxsWask+72Jf+1C01WcLhoTBbrTCOvBOeNcJ7kKpMRDVJZLLSMQyWV5kGf8XJasGzC0vn+uNFqjYnInaJdnbG+fI8uNGnja5UunRvhIcbJMStRdga64UVX/4Kjbp8plM7TqPigZVyIbnKiwC7EREJCQkJCQsL/k38AUuNHv8Cc+hoAAAAASUVORK5CYII=" alt="cloud--v1" style={{ width: "60px", height: "60px",  marginLeft: "30px", userSelect: "none" }}></img>

            <span
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginLeft: "30px",
		userSelect: "none"
	      }}
            >
             Cloud
            </span>
          </div>
        </Col>

        <Col
          className="gutter-row"
          span={5} // Each column takes up 7 spans
          onClick={handleRedirectRemoveNode}
          style={style}
        >
          <div style={{ display: "flex", alignItems: "center" }}>

                <img src="data:image/png;base64,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" alt="cloud-development--v3"

          style={{ width: "60px", height: "60px", marginLeft: "30px", userSelect: "none" }}></img>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginLeft: "30px",
		userSelect: "none"
              }}
            >
              Edge Cloud
            </span>
          </div>
        </Col>



 <Col
          className="gutter-row"
          span={5} // Each column takes up 7 spans
          onClick={handleDistributedStorage}
          style={style}
        >
          <div style={{ display: "flex", alignItems: "center" }}>

<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFZklEQVR4nO1bWYgcZRD+4xFEk4Cg4o0aj7gPgu7u/P9MNqwIXqCo6BoRwYvsiyS421Wz69NoEBPRBw/wQVEjigE1moDBB4UEjSIEIqgviokSkhDjydpVPVHZlur+Z8+ZnZ7p7tmZsT9o2On+j6rq+r86ZlapDBnaFkND/ok55DUG6FmN9IVG+kkDeQbJNUgHDPJ7Bmmk91H3HNVVKPknaOD7RGGD7Ne7NNA/BvjdAngrVadDj3kXGeC9UwoCfW+AS9rxru0H9+zeYf/kwZK/TBfLV5oi36+R3w8MEBrC08hjSvlLVCciVyRjgI+GytMBDXRnFGVyRTpfA709wyPe6in5SxMRqgDeSo38kQGiKO6YyAW8rYD+8kZlzRXproqcGmhLbE8YLPknBS7YKsXt2xMOaFZmA7xaI7H1opFYBsg53nWBUEg/DDw2caZKCQb5eWuAL+WMx11PO3yPNYC7eowvbHqhHDCEb4VfVKmSHh03SH8XsHxFYusCf2BJ9LUYi9AW6wHDKiUY5Jfs23o9yXX7R8uXG6RJOQ4D43+e3tQiGnmfCFcAzicpXG/JP1UDjxuk7ypnvx+pTyUMDfRJ6MHeA00RoA6zrslmGHlhXqGDs4mPj6URu4UE7R4vNzxZS6Jh43FSAuXRe6iStAjhGaRnbNjbqVKARAS7/t7GJzt8t528Iwlh8ujeopH+taHuCcnzxTXt51dVCsg53sVNv0SDtNFOfjKuIL2jE2cY4F9DQpVUNUQe6fZE4nUN9I3yBXb9gw1PNsjbrcBrk2N6/nDuWZc0No3zL3WDdmhDxQMajgQGaL9MzjnlnjiC5Nb7KyQhEfeX0KRaBCmfZxFtcPxoqxn3Lq07ebDkL7MxtCzRIImsTCN9HGedhvcteg9q5HekSNJIe6bJl9ywyKpXlWHg/l/FFcQAP2fJtKgWEXLUDNKbFW/QRe/6moM1uOvswDfibiz1enCUgG5TbQAhdXssjoin1ytOMPaGwDsDYzruzapduk2WH7RDG6qOMUi7Qrd1b4q7n+T4wVqO97BqE+SRh2z+sbvqgErMNiN0XtzNwpw/3YqyUeSdv86yHPfbvIcFpHNrPmwCBt1rLAkejRtRksJgyT/FlsrH5z3MF90bbbjYldSGGvhrS4SPqDaA5DbWAPtrN0GQX0hqQ+PQrXbNPzSWL1OLDI30+HTfcA4k9KXRBJG+fSUtlSJFLRL6xr1LNNBE4JHIa1rbBKmEH+DfDfC9cZqfMbpEtglDW1vWBJlVFwBvm87P+RvJEPOj7tVSMaoUIIYXItZIT4dfqYX9gapJkK40QaqRQ2LwlwR9AKAfW9lut299UpqkVzn+aQs3QZC3q5Qh7W8DdIcGfiXwBORfUvqewTPA30oeIp4QMU+mjarDMUOX6A0dA7xDJkmqqDoc0shpuKVnwu/c/fxoeZXqcDTc1C2gvzypJkg7YGZEk+hTd0IBOG9D0z7VJZCGTpDwFMlEGEzDNdPDDsVUVgvuuvqDQcJE4AGO6hI0VNdooN1hxebdoLoEDVW2Gvnn1mdmrblEt7oGMJImtoGw6Vw0GcEAHAxWXYbIepnMAJx5gMmOAM87K/KDw7CZwEc08GEDtDmxHyF2AgcYoM2VUDIdKmlTXME00OcG6LM07y2kl4o6UAMfFsWlWJJLfs8j92ZtPDfsVBEkyn5J30vcALn1/orAAMiHpp4j7aligE+7xgAGadPUEQA+FvwN9JSKicBwcwyV9L2F9FJRB/aU/KViBOsJh0T5/xUJdjoyA2DmAX4kz9aS5AjBjfGA6hIE/3AVEvhU1KoJY9m+G69IUatnBtt3jeIdGLUyZMiQIYNqIf4DTUlVDVrtZMoAAAAASUVORK5CYII=" alt="cloud-storage"       style={{ width: "60px", height: "60px", marginLeft: "30px", userSelect: "none" }}></img>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginLeft: "30px",
                userSelect: "none"
              }}
            >
              Distributed Storage
            </span>
          </div>
        </Col>




      </Row>

      <Content style={{ margin: "16px 16px" }}>
        <div
          style={{
            padding: 30,
            minHeight: "auto",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </div>
      </Content>
    </Layout1>
  );
}
