

# Parameters

- *N<sub>u</sub>*: Users who has a waylens camera
- *N<sub>m</sub>*: Monthly new *moments* per user
- *T<sub>m</sub>*: Average length of video in a *moment*:
- *N<sub>a</sub>*: Total audiences
- *S*: Monthly sessions per audience per month
>  A session is the period time an audience is actively engaged with the video website.

- *T<sub>s</sub>*: Average length of video viewed per session:

# Variables

- *T<sub>up</sub>*: Total length of video uploaded per month
>  *T<sub>up</sub>* = *N<sub>u</sub>* · *N<sub>m</sub>* · *T<sub>m</sub>*

- *T<sub>acc</sub>*: Total length of video uploaded (accumulated)
> *T<sub>acc</sub>* = ∑ *T<sub>up</sub>*

- *T<sub>down</sub>*: Total length of video downloaded per month
> *T<sub>down</sub>* = *N<sub>a</sub>* · *S* · *T<sub>s</sub>*

# Cost Computation

## Assumptions

- Deploy to CDN only in United States
> CDN cost in different region is different

- The duration of each moment is integral multiple of 1 minute
> Fractional minutes are rounded up when charged by Transcoder.

- The cost for EC2 and its storage service(EBS) is constant
>
> EC2 is used for Web Service and Overlay Transcoding,
> needs to scale out when *T<sub>up</sub>* is quite large
>
> EBS is used for VDB service,
> needs to scale out when *T<sub>acc</sub>* is quite large



## Notation

For the function notation, see the line below:
> Storage cost: *ß<sub>s</sub>*(*T<sub>acc</sub>*)

Here I use *ß<sub>s</sub>* to refer to *Stoarge cost*. The following symbol wrapped by parenthesis means *ß<sub>s</sub>* depends on variable/parameter *T<sub>acc</sub>*.



## Functions
- S3 bucket
  - Upload cost: *Zero*
  > No cost if data is transferred from Amazon EC2

  - Download cost: *Zero*
  > No cost if data is transferred to Amazon Cloudfront (CDN).
  > See Cloudfront Deploy cost below

  - Storage cost: *ß<sub>s</sub>*(*T<sub>acc</sub>*)

- Elastic Transcoder
  - Transcoding: *E*(*T<sub>up</sub>*)

- Cloudfront (CDN)
  - Deploy cost: *C<sub>dep</sub>*(*T<sub>up</sub>*)
  > Charged by "Data Transfer Out to Origin" (from S3 to CDN)

  - Serve cost: *C<sub>srv</sub>*(*T<sub>down</sub>*)
  > Charged by "Data Transfer Out to Internet"

- EC2
  - Server cost (constant): *EC*

- Elastic Block Store (EBS)
  - Storage cost (constant): *EBS*

## Total Cost

*Total*(*T<sub>acc</sub>* , *T<sub>up</sub>* , *T<sub>down</sub>*) = *ß<sub>s</sub>*(*T<sub>acc</sub>*) + *E*(*T<sub>up</sub>*) + *C<sub>dep</sub>*(*T<sub>up</sub>*) + *C<sub>srv</sub>*(*T<sub>down</sub>*) +
*EC* + *EBS*
